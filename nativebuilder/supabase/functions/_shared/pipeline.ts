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
import { searchEngine, type Provider, type SearchResult } from "./search.ts";

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
export async function cachedSearch(
  toolName: string,
  query: string,
): Promise<{ results: SearchResult[]; provider: Provider | "cache" }> {
  const key = await cacheKey(toolName, query);

  const { data: cached } = await db
    .from("scrape_cache")
    .select("raw_response")
    .eq("cache_key", key)
    .maybeSingle();

  // An empty cached result is treated as a miss. Caching a failed search
  // poisons that query permanently -- which is exactly what happened when
  // DuckDuckGo changed its markup: every module kept serving [] from cache
  // long after the underlying problem was fixable.
  const hit = cached?.raw_response as SearchResult[] | undefined;
  if (Array.isArray(hit) && hit.length > 0) {
    return { results: hit, provider: "cache" };
  }

  const { results, provider } = await searchEngine(query);

  if (results.length > 0) {
    // upsert, so a previously poisoned row gets replaced rather than colliding.
    // tool_name records which provider paid for the row, so a cache built on
    // the free fallback is distinguishable from one built on Bright Data.
    await db
      .from("scrape_cache")
      .upsert(
        { cache_key: key, tool_name: `${toolName}:${provider}`, raw_response: results },
        { onConflict: "cache_key" },
      );
  }

  return { results, provider };
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
