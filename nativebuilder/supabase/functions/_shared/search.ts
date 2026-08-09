/**
 * Web search facade.
 *
 * Bright Data's SERP API when BRIGHTDATA_API_TOKEN is set, DuckDuckGo HTML
 * otherwise. This is the swap the codebase was built for since the first
 * version — every module calls `searchEngine`, so the provider changes here and
 * nowhere else.
 *
 * The difference is not cosmetic. DuckDuckGo's HTML endpoint ignores `site:`
 * filters and rate-limits hard; Bright Data returns parsed Google results and
 * doesn't get blocked, which is what makes `site:linkedin.com/in` queries
 * actually work.
 */

import * as brightdata from "./brightdata.ts";
import type { SearchResult } from "./search-types.ts";

export type { SearchResult };

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(href: string): string {
  try {
    const url = new URL(href.startsWith("//") ? `https:${href}` : href);
    const target = url.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : url.toString();
  } catch {
    return href;
  }
}

/** Free fallback: DuckDuckGo's HTML endpoint. No key, no signup, no `site:`. */
async function duckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ q: query }),
  });

  if (!response.ok) throw new Error(`duckduckgo search failed: ${response.status}`);

  const html = await response.text();
  const results: SearchResult[] = [];

  for (const block of html.split('class="result__body"').slice(1)) {
    if (results.length >= maxResults) break;

    const link = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
      .exec(block);
    if (!link) continue;

    const title = stripTags(link[2] ?? "");
    if (!title) continue;

    const snippet = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

    results.push({
      title,
      url: normalizeUrl(link[1] ?? ""),
      snippet: snippet ? stripTags(snippet[1] ?? "") : "",
    });
  }

  return results;
}

/** Which provider actually served the last call — surfaced so the UI can say
 * where the evidence came from rather than leaving it implicit. */
export type Provider = "brightdata" | "duckduckgo";

export async function searchEngine(
  query: string,
  maxResults = 8,
): Promise<{ results: SearchResult[]; provider: Provider }> {
  if (brightdata.isEnabled()) {
    try {
      const results = await brightdata.searchEngine(query, maxResults);
      if (results.length > 0) return { results, provider: "brightdata" };
      console.warn("bright data returned no results; falling back to duckduckgo");
    } catch (err) {
      // A billing or zone problem shouldn't take the whole module down.
      console.warn(`bright data search failed, falling back: ${err}`);
    }
  }
  return { results: await duckDuckGo(query, maxResults), provider: "duckduckgo" };
}
