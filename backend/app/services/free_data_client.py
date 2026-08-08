"""Free, no-signup web data sources.

Used in place of Bright Data while that account is stuck behind payment
verification (see bright-data.md). Same call shape as the search/scrape
functions in brightdata_client.py -- swapping back later is a one-line
change in web_client.py, callers don't need to change.

No anti-bot bypass here, so this will fail on heavily protected sites
(Google, LinkedIn, etc). DuckDuckGo's HTML endpoint and plain page fetches
are what's realistic without Bright Data.
"""

import httpx
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def search_engine(query: str, *, max_results: int = 8) -> list[dict]:
    """DuckDuckGo HTML search results -- no API key needed."""
    with httpx.Client(timeout=20, headers={"User-Agent": USER_AGENT}) as client:
        resp = client.post("https://html.duckduckgo.com/html/", data={"q": query})
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    results = []
    for result in soup.select(".result__body")[:max_results]:
        title_el = result.select_one(".result__title a")
        snippet_el = result.select_one(".result__snippet")
        if not title_el:
            continue
        results.append(
            {
                "title": title_el.get_text(strip=True),
                "url": title_el.get("href", ""),
                "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
            }
        )
    return results


def scrape_as_markdown(url: str, *, max_chars: int = 6000) -> str:
    """Fetch a URL and return readable text. Best-effort -- sites with bot
    protection will simply fail here (that's the gap Bright Data closes)."""
    with httpx.Client(timeout=20, headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = " ".join(soup.get_text(separator=" ").split())
    return text[:max_chars]
