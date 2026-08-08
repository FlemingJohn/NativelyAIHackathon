> **Status: on hold.** Bright Data's account requires payment verification (card or PayPal) to unlock Web Unlocker/zone creation, which we're not doing right now — see [technical-plan.md](./technical-plan.md) for the free-data-source workaround currently in place. This doc stays as the reference for swapping Bright Data back in later.

# Bright Data MCP Server — Reference

Research notes on Bright Data's Model Context Protocol (MCP) server, gathered for this project. This is what lets our AI agents (called via AIML API) reach out to the live web as a tool-call instead of us hand-rolling scrapers.

Sources: [brightdata/brightdata-mcp](https://github.com/brightdata/brightdata-mcp), [MCP Tools Reference](https://github.com/brightdata/skills/blob/main/skills/bright-data-mcp/references/mcp-tools.md), [Bright Data MCP docs](https://docs.brightdata.com/mcp-server/faqs), [MCP Server Pricing](https://brightdata.com/pricing/mcp-server)

## What it is

An MCP server that gives any MCP-compatible AI agent (Claude, GPT, Gemini, Llama, LangChain agents, etc.) tool-call access to public web data — search, page scraping, and 60+ platform-specific structured extractors — with Bright Data handling proxy rotation, anti-bot/CAPTCHA, and geo-unblocking behind the scenes. Two deployment modes: **remote/hosted** (zero setup, just an endpoint + token) or **local** (`npx @brightdata/mcp`, self-hosted).

## Setup

**NPM package:** `@brightdata/mcp` — run via `npx @brightdata/mcp`.

**Hosted option (no install):**
```
https://mcp.brightdata.com/mcp?token=YOUR_API_TOKEN_HERE
```

**MCP client config (Claude Desktop / Claude Code style):**
```json
{
  "mcpServers": {
    "Bright Data": {
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "your-token-here"
      }
    }
  }
}
```

For our backend (not an MCP-native client), we'll likely call Bright Data's underlying REST APIs directly rather than speaking MCP protocol — see [Architecture note](#architecture-note-for-our-backend) below.

### Environment variables

| Var | Purpose |
|---|---|
| `API_TOKEN` | **Required.** Bright Data API token. |
| `PRO_MODE` | Set `true` to unlock all 60+ tools (default is a smaller free rapid set). |
| `GROUPS` | Comma-separated tool-group bundles to enable (see below) — keeps context/tool-count small. |
| `TOOLS` | Comma-separated individual tool names, for even finer control. |
| `WEB_UNLOCKER_ZONE` | Custom Web Unlocker zone name (default `mcp_unlocker`). |
| `BROWSER_ZONE` | Custom scraping-browser zone name (default `mcp_browser`). |
| `POLLING_TIMEOUT` | Seconds to wait for `web_data_*` async results (default 600). |
| `BASE_TIMEOUT` / `BASE_MAX_RETRIES` | Timeout/retry tuning for base tools. |
| `RATE_LIMIT` | Custom rate-limit string. |

### Tool groups (via `GROUPS`)

`code`, `browser`, `ecommerce`, `social`, `finance`, `business`, `research`, `app_stores`, `travel`, `geo`, `advanced_scraping` — enable only what a given module needs, to keep the agent's tool list small and cheap.

## Pricing / credits

- **Rapid mode**: free, 5,000 credits/month, auto-renews, no card required.
- **Pro mode**: pay-as-you-go, unlocks all 60+ tools.
- Credit cost: base tools (search/scrape) = 1 credit/request; `web_data_*` structured tools = 1 credit per record returned.
- Unused credits don't roll over; usage simply stops when credits are exhausted (unless you fund the account) — no surprise overage.
- Shared credit pool drawn from the Web Unlocker API; team accounts share the allocation.

**Hackathon implication:** cache every scrape/extract result in our DB keyed by URL+query. Re-running a demo or re-testing a module shouldn't burn credits twice.

## Tool catalog, mapped to our 4 modules

### Base tools (always available, cheap — 1 credit)

| Tool | Does |
|---|---|
| `search_engine` | SERP results from Google/Bing/Yandex, JSON or Markdown, paginated |
| `scrape_as_markdown` | One URL → clean Markdown |
| `discover` | AI-ranked search results by intent, with geo/date/keyword filters |
| `search_engine_batch` | Up to 10 parallel searches (Pro) |
| `scrape_batch` | Up to 10 parallel page scrapes |
| `scrape_as_html` | Raw HTML of a page |
| `extract` | Page → Markdown → structured JSON via an extraction prompt (useful when there's no dedicated `web_data_*` tool for a site) |
| `session_stats` | Usage stats for the current session (good for a demo "credits used" readout) |

### Idea Brainstorming module

Signal-gathering for "give me a billion-dollar idea in X":
- `search_engine` / `discover` — recent news, trend signal, "state of X industry"
- `scrape_as_markdown` — pull full articles/reports found via search
- `web_data_reddit_posts` — pain points/discussion in relevant subreddits
- `web_data_reuter_news` — structured news article data
- `web_data_npm_package` / `web_data_pypi_package` — useful if the idea is dev-tooling-adjacent (gauge ecosystem activity)

### Market Research module

- `search_engine` + `scrape_as_markdown` — competitor discovery, pricing pages, market reports
- `web_data_crunchbase_company` — competitor funding history, structured
- `web_data_yahoo_finance_business` — public-company financial/market data if relevant
- `web_data_google_shopping` / e-commerce tools (`web_data_amazon_product`, etc.) — only relevant if the idea is a physical product
- `extract` — turn any competitor page (pricing, feature list) into structured JSON without a dedicated tool

### Cofounder Search module

This is the one place my earlier assumption in `ideas.md` was **wrong** — Bright Data does have compliant structured LinkedIn extractors, not just raw scraping:
- `web_data_linkedin_person_profile` — structured profile data from a LinkedIn profile URL
- `web_data_linkedin_people_search` — structured results from a LinkedIn people-search URL (this is the key one for matching)
- `web_data_linkedin_posts` — a candidate's recent posts/activity, useful signal for "actively building" vs dormant profile
- `web_data_github_repository_file` — for vetting technical cofounders' actual code/repos
- `web_data_x_posts` — public X/Twitter activity as a secondary signal

This meaningfully de-risks module 3 versus what I assumed in `ideas.md` — **update the build-priority note**: cofounder search no longer needs a seeded/mock dataset as a fallback; it can be real, backed by LinkedIn people-search + profile extraction. Still worth a mock fallback for demo reliability (rate limits / a specific search returning nothing on stage), but it's no longer the highest-risk module.

### Investor Search module

- `web_data_crunchbase_company` — VC firm / fund structured data (portfolio, focus)
- `web_data_linkedin_company_profile` + `web_data_linkedin_person_profile` — firm and individual-partner profiles
- `search_engine` + `scrape_as_markdown` — firm's own "thesis"/"portfolio" pages, which are often not on Crunchbase/LinkedIn
- `web_data_linkedin_posts` — a partner's recent public commentary, useful for personalizing outreach angle

### Browser automation (Pro, session-based)

`scraping_browser_navigate`, `_go_back`, `_go_forward`, `_snapshot`, `_click_ref`, `_type_ref`, `_screenshot`, `_network_requests`, `_wait_for_ref`, `_get_text`, `_get_html`, `_scroll`, `_scroll_to_ref` — full headless-browser control for anything behind interaction (login walls, infinite scroll, JS-rendered content). Likely overkill for our MVP; the `web_data_*` structured tools and `scrape_as_markdown`/`extract` should cover all four modules without needing to drive a browser session by hand.

### Other categories available but not core to our MVP

E-commerce (Amazon, Walmart, eBay, Home Depot, Zara, Etsy, Best Buy, Google Shopping), broader social (Instagram, Facebook, TikTok, YouTube), Maps reviews, app stores (Google Play, Apple App Store), real estate (Zillow), travel (Booking.com), ZoomInfo. Good to know they exist in case a demo idea lands in one of these verticals (e.g. an idea in the e-commerce space could pull real `web_data_amazon_product` comps).

## Architecture note for our backend

Our backend won't be an MCP client in the Claude Desktop sense — it's a FastAPI service. Two integration paths:

1. **Direct REST calls** to Bright Data's underlying Web Unlocker / SERP / Datasets APIs (same capabilities as the MCP tools, called as plain HTTP from our extraction functions) — simplest, most predictable for a hackathon backend.
2. **Run the MCP server as a subprocess/service and speak MCP protocol to it** from our backend, treating it exactly like a tool-calling target for AIML API's function-calling — more "AI-native" and a stronger technical story for judges (the LLM is literally the one deciding which Bright Data tool to call and with what args), at the cost of an extra moving part.

**Recommendation:** build the MVP on path 1 (direct calls, predictable, fast to build and debug) but structure our internal "tool" functions 1:1 with the MCP tool names above (`search_engine`, `web_data_linkedin_people_search`, etc.). That keeps the door open to swap in path 2 later — e.g. as a stretch-goal demo of "the agent chose to call Bright Data itself" — without restructuring the extraction layer.

## Direct REST contracts (for path 1 above)

**Web Unlocker / SERP** — same endpoint, different `zone`, synchronous:
```
POST https://api.brightdata.com/request
Authorization: Bearer <BRIGHTDATA_API_TOKEN>
Content-Type: application/json

{ "zone": "<unblocker-or-serp-zone-name>", "url": "https://example.com", "format": "raw" }
```
For SERP, append `brd_json=1` to the target Google/Bing URL's query string to get parsed JSON back instead of raw HTML.

**Datasets API (`web_data_*` structured extractors)** — async trigger/poll/download, because these run a full collection job server-side:
```
POST https://api.brightdata.com/datasets/v3/trigger        # body includes dataset_id (e.g. gd_xxxxxxxxxxxx) + input URLs → returns snapshot_id
GET  https://api.brightdata.com/datasets/v3/progress/{snapshot_id}   # poll until status == "ready" (statuses: scheduled, building, ready, failed)
GET  https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}   # download the resulting records once ready
```
Each `web_data_*` tool (e.g. `web_data_linkedin_person_profile`) maps to a specific `dataset_id` (format `gd_...`) — these are per-platform IDs found on the Bright Data dashboard under each scraper's Configuration tab, not something we can hardcode from docs alone.

Sources: [Send your first Web Unlocker API request](https://docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request), [Send Your First SERP API Request](https://docs.brightdata.com/scraping-automation/serp-api/send-your-first-request), [Trigger Asynchronous data collection API](https://docs.brightdata.com/api-reference/web-scraper-api/asynchronous-requests), [Monitor Progress](https://docs.brightdata.com/api-reference/web-scraper-api/management-apis/monitor-progress)

## Open items to confirm once we have the account

- Confirm which `GROUPS` our API token has enabled by default and whether `PRO_MODE` is needed for `web_data_linkedin_*` (these look like Pro-tier tools).
- Look up the actual `gd_...` dataset IDs for the specific `web_data_*` tools we use (LinkedIn person profile, LinkedIn people search, Crunchbase company, Reddit posts) from the Bright Data dashboard once the account is set up.
- Confirm per-record credit cost for `web_data_linkedin_people_search` specifically, since a "search" tool could return many records per call.
- Datasets API jobs are async (trigger → poll → download) and can take real wall-clock time — the backend endpoints that use them (`extract_structured` calls) should not block a request/response cycle naively; plan for polling with a timeout, and consider returning a "still processing" state to the frontend for slower lookups.
