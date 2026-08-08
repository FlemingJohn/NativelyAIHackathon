"""Thin wrapper around Bright Data's REST APIs.

Function names mirror the Bright Data MCP tool names 1:1 (see bright-data.md)
so this module can be swapped for a real MCP client later without touching
callers. Two request shapes:

- Web Unlocker / SERP: synchronous, POST /request
- Datasets (web_data_* structured extractors): async trigger -> poll -> download
"""

import time

import httpx

from app.config import settings

BASE_URL = "https://api.brightdata.com"

# Per-platform dataset IDs (format gd_xxxxxxxxxxxx), looked up from the
# Bright Data dashboard (Scraper Configuration tab). Fill in once the
# account is provisioned -- see "Open items" in bright-data.md.
DATASET_IDS: dict[str, str] = {
    "web_data_linkedin_person_profile": "",
    "web_data_linkedin_people_search": "",
    "web_data_linkedin_company_profile": "",
    "web_data_linkedin_posts": "",
    "web_data_crunchbase_company": "",
    "web_data_reddit_posts": "",
}


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.brightdata_api_token}",
        "Content-Type": "application/json",
    }


def fetch_url(url: str, *, zone: str | None = None, format: str = "raw") -> str:
    """Web Unlocker: fetch a single URL, bot-protection handled server-side."""
    zone = zone or settings.brightdata_web_unlocker_zone
    with httpx.Client(timeout=60) as client:
        resp = client.post(
            f"{BASE_URL}/request",
            headers=_headers(),
            json={"zone": zone, "url": url, "format": format},
        )
        resp.raise_for_status()
        return resp.text


def scrape_as_markdown(url: str) -> str:
    return fetch_url(url, format="raw")


def search_engine(query: str, *, engine: str = "google", zone: str | None = None) -> str:
    """SERP API: search results as parsed JSON (brd_json=1)."""
    from urllib.parse import quote

    engine_urls = {
        "google": f"https://www.google.com/search?q={quote(query)}&brd_json=1",
        "bing": f"https://www.bing.com/search?q={quote(query)}&brd_json=1",
    }
    return fetch_url(engine_urls[engine], zone=zone, format="raw")


def trigger_dataset(dataset_id: str, inputs: list[dict]) -> str:
    """Kick off an async Datasets collection job. Returns a snapshot_id."""
    with httpx.Client(timeout=30) as client:
        resp = client.post(
            f"{BASE_URL}/datasets/v3/trigger",
            headers=_headers(),
            params={"dataset_id": dataset_id},
            json=inputs,
        )
        resp.raise_for_status()
        return resp.json()["snapshot_id"]


def poll_snapshot(snapshot_id: str, *, timeout: float = 120, interval: float = 3) -> str:
    """Poll until the snapshot is ready/failed, or raise TimeoutError."""
    with httpx.Client(timeout=30) as client:
        elapsed = 0.0
        while elapsed < timeout:
            resp = client.get(f"{BASE_URL}/datasets/v3/progress/{snapshot_id}", headers=_headers())
            resp.raise_for_status()
            status = resp.json().get("status")
            if status in ("ready", "failed"):
                return status
            time.sleep(interval)
            elapsed += interval
    raise TimeoutError(f"snapshot {snapshot_id} not ready after {timeout}s")


def get_snapshot_data(snapshot_id: str) -> list[dict]:
    with httpx.Client(timeout=60) as client:
        resp = client.get(f"{BASE_URL}/datasets/v3/snapshot/{snapshot_id}", headers=_headers())
        resp.raise_for_status()
        return resp.json()


def run_dataset_tool(tool_name: str, inputs: list[dict], *, timeout: float = 120) -> list[dict]:
    """Convenience: trigger + poll + download for a web_data_* tool."""
    dataset_id = DATASET_IDS.get(tool_name)
    if not dataset_id:
        raise ValueError(f"no dataset_id configured for {tool_name!r} -- set it in DATASET_IDS")
    snapshot_id = trigger_dataset(dataset_id, inputs)
    status = poll_snapshot(snapshot_id, timeout=timeout)
    if status != "ready":
        raise RuntimeError(f"{tool_name} snapshot {snapshot_id} ended with status={status}")
    return get_snapshot_data(snapshot_id)
