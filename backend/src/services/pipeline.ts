/**
 * Shared gather -> extract -> synthesize pipeline used by all four modules.
 *
 * 1. gather: call the web-data source (through cachedFetch, so repeat demo
 *    runs don't burn credits) to get raw web data.
 * 2. extract: cheap AIML model turns raw data into structured facts.
 * 3. synthesize: reasoning AIML model turns structured facts + profile context
 *    into the module's final output.
 */

import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { scrapeCache } from "../db/schema.js";
import * as aimlClient from "./aimlClient.js";

function cacheKey(toolName: string, query: string): string {
  return createHash("sha256").update(`${toolName}:${query}`).digest("hex");
}

/** Look up (toolName, query) in scrape_cache; call fetchFn and store on miss. */
export async function cachedFetch<T>({
  toolName,
  query,
  fetchFn,
}: {
  toolName: string;
  query: string;
  fetchFn: () => Promise<T>;
}): Promise<unknown> {
  const key = cacheKey(toolName, query);

  const [cached] = await db
    .select({ rawResponse: scrapeCache.rawResponse })
    .from(scrapeCache)
    .where(eq(scrapeCache.cacheKey, key))
    .limit(1);
  if (cached) return cached.rawResponse;

  const result = await fetchFn();
  const payload = result !== null && typeof result === "object" ? result : { raw: result };

  await db
    .insert(scrapeCache)
    .values({ cacheKey: key, toolName, rawResponse: payload })
    .onConflictDoNothing({ target: scrapeCache.cacheKey });

  return payload;
}

/** Models are asked for bare JSON but sometimes wrap it in ```json fences
 * anyway -- strip those before parsing rather than losing the whole response
 * to a parse error. */
export function parseJson<T>(text: string, fallback: T): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/** Cheap-model pass: raw scraped text -> structured JSON facts. */
export async function extractFacts(
  rawContext: string,
  extractionPrompt: string,
): Promise<unknown> {
  const content = await aimlClient.chat(
    [
      {
        role: "system",
        content: "Extract structured facts as compact JSON. Respond with JSON only.",
      },
      { role: "user", content: `${extractionPrompt}\n\n---\n${rawContext}` },
    ],
    { reasoning: false },
  );
  // The fast model wraps its JSON in ```json fences often enough that parsing
  // the bare string throws away most extractions -- the synthesis pass then
  // reasons over `{raw: "```json..."}` instead of real facts.
  return parseJson<unknown>(content, { raw: content });
}

/** Reasoning-model pass: structured facts + profile context -> final output. */
export function synthesize(systemPrompt: string, userPrompt: string): Promise<string> {
  return aimlClient.chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { reasoning: true },
  );
}
