/** DuckDuckGo HTML search -- no API key, no signup. Runs here rather than in
 * the browser because cross-origin requests to html.duckduckgo.com are blocked.
 *
 * Same call shape the Bright Data client would expose, so swapping to it later
 * is one import change (see bright-data.md). */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type SearchResult = { title: string; url: string; snippet: string };

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

/** DuckDuckGo sometimes returns a redirect wrapper instead of the destination. */
function normalizeUrl(href: string): string {
  try {
    const url = new URL(href.startsWith("//") ? `https:${href}` : href);
    const target = url.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : url.toString();
  } catch {
    return href;
  }
}

export async function searchEngine(query: string, maxResults = 8): Promise<SearchResult[]> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ q: query }),
  });

  if (!response.ok) {
    throw new Error(`duckduckgo search failed: ${response.status}`);
  }

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
