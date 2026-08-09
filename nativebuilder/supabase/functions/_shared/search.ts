/**
 * Web search. Bright Data only.
 *
 * There is deliberately no fallback provider. The previous DuckDuckGo path was
 * removed for two reasons:
 *
 *   1. Scraping a search engine's HTML endpoint is not a supported use of it.
 *      Bright Data's SERP API is the sanctioned way to get Google results.
 *   2. It failed silently. When DuckDuckGo changed its markup the parser
 *      returned zero results with HTTP 200, so every module reported "nothing
 *      found" — indistinguishable from a genuinely empty search, and the empty
 *      result got cached.
 *
 * Now a search either works or raises. A module that can't gather evidence says
 * so instead of quietly producing an answer with nothing behind it.
 */

import * as brightdata from "./brightdata.ts";
import { HttpError } from "./cors.ts";
import type { SearchResult } from "./search-types.ts";

export type { SearchResult };

/** Only two possibilities now: a live Bright Data call, or a cache hit. */
export type Provider = "brightdata";

export async function searchEngine(
  query: string,
  maxResults = 8,
): Promise<{ results: SearchResult[]; provider: Provider }> {
  if (!brightdata.isEnabled()) {
    throw new HttpError(
      503,
      "Web search is not configured — set BRIGHTDATA_API_TOKEN in Edge Function secrets.",
    );
  }

  try {
    const results = await brightdata.searchEngine(query, maxResults);
    return { results, provider: "brightdata" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HttpError(502, `Web search failed: ${detail}`);
  }
}
