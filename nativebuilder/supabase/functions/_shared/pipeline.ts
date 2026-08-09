/**
 * Shared gather -> extract -> synthesize pipeline used by all four modules.
 *
 * 1. gather: web search, cached in scrape_cache so repeat demo runs don't redo
 *    work (and don't burn Bright Data credits once that's wired up).
 * 2. extract: cheap model turns raw results into structured facts.
 * 3. synthesize: reasoning model turns facts + profile context into the
 *    module's final output.
 */

import { chat } from "./aiml.ts";
import { db } from "./db.ts";
import { searchEngine, type SearchResult } from "./search.ts";

const SIGNAL_LIMIT = 8000;

/** Models are told to return bare JSON but often wrap it in ```json fences.
 * Stripping them is load-bearing: without it an unparsed extraction feeds
 * `{raw: "```json..."}` into synthesis, which is exactly what made the
 * cofounder and investor modules return empty lists. */
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

async function cacheKey(toolName: string, query: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${toolName}:${query}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Look up (toolName, query) in scrape_cache; run the search on a miss. */
export async function cachedSearch(toolName: string, query: string): Promise<SearchResult[]> {
  const key = await cacheKey(toolName, query);

  const { data: cached } = await db
    .from("scrape_cache")
    .select("raw_response")
    .eq("cache_key", key)
    .maybeSingle();

  if (cached?.raw_response) return cached.raw_response as SearchResult[];

  const results = await searchEngine(query);
  await db
    .from("scrape_cache")
    .insert({ cache_key: key, tool_name: toolName, raw_response: results });

  return results;
}

/** Truncated JSON of the raw signal, as handed to the extraction model. */
export function signal(results: unknown): string {
  return JSON.stringify(results).slice(0, SIGNAL_LIMIT);
}

/** Cheap-model pass: raw search results -> structured JSON facts. */
export async function extractFacts(
  rawContext: string,
  extractionPrompt: string,
): Promise<unknown> {
  const content = await chat(
    [
      {
        role: "system",
        content: "Extract structured facts as compact JSON. Respond with JSON only.",
      },
      { role: "user", content: `${extractionPrompt}\n\n---\n${rawContext}` },
    ],
    { reasoning: false },
  );
  return parseJson<unknown>(content, { raw: content });
}

/** Reasoning-model pass: structured facts + profile context -> final output. */
export function synthesize(systemPrompt: string, userPrompt: string): Promise<string> {
  return chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { reasoning: true },
  );
}
