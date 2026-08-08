/**
 * Free, no-signup web data sources.
 *
 * Used in place of Bright Data while that account is stuck behind payment
 * verification (see bright-data.md). Same call shape as the search/scrape
 * functions in brightdataClient.ts -- swapping back later is a one-line
 * change in webClient.ts, callers don't need to change.
 *
 * No anti-bot bypass here, so this will fail on heavily protected sites
 * (Google, LinkedIn, etc). DuckDuckGo's HTML endpoint and plain page fetches
 * are what's realistic without Bright Data.
 */

import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

/** DuckDuckGo HTML search results -- no API key needed. */
export async function searchEngine(
  query: string,
  { maxResults = 8 }: { maxResults?: number } = {},
): Promise<SearchResult[]> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ q: query }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`duckduckgo search failed: ${response.status} ${response.statusText}`);
  }

  const $ = cheerio.load(await response.text());
  const results: SearchResult[] = [];
  $(".result__body")
    .slice(0, maxResults)
    .each((_, element) => {
      const titleEl = $(element).find(".result__title a").first();
      if (titleEl.length === 0) return;
      results.push({
        title: titleEl.text().trim(),
        url: titleEl.attr("href") ?? "",
        snippet: $(element).find(".result__snippet").first().text().trim(),
      });
    });
  return results;
}

/** Fetch a URL and return readable text. Best-effort -- sites with bot
 * protection will simply fail here (that's the gap Bright Data closes). */
export async function scrapeAsMarkdown(
  url: string,
  { maxChars = 6000 }: { maxChars?: number } = {},
): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`fetch failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const $ = cheerio.load(await response.text());
  $("script, style, nav, footer, header").remove();
  return $.root().text().split(/\s+/).join(" ").trim().slice(0, maxChars);
}
