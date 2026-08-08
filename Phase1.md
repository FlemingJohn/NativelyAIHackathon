# Phase 1 — What's Built

Status snapshot of the technical implementation so far. Background/rationale docs: [ideas.md](./ideas.md) (product brainstorm), [bright-data.md](./bright-data.md) (Bright Data reference, currently on hold), [technical-plan.md](./technical-plan.md) (architecture plan this was built against).

## What's implemented

**Backend** — FastAPI (Python 3.12), SQLite via SQLAlchemy, all 4 modules wired end-to-end:

```
backend/app/
  main.py                 app entrypoint, CORS, router registration, /health
  config.py                env-driven settings (pydantic-settings)
  db.py                     SQLAlchemy engine/session
  models/models.py          StartupProfile, IdeaCard, MarketReport, CofounderMatch, InvestorLead, ScrapeCache
  schemas.py                 Pydantic request/response models
  routers/
    profile.py                POST/GET/PATCH /profile — Startup Profile CRUD
    idea.py                     POST /idea/generate
    market.py                    POST /market/research
    cofounder.py                  POST /cofounder/search
    investor.py                    POST /investor/search
  services/
    aiml_client.py             AIML API wrapper (OpenAI-compatible client, fast vs reasoning model split)
    web_client.py                facade the routers actually import for web data
    free_data_client.py           DuckDuckGo HTML search + plain page fetch — no signup, in use now
    brightdata_client.py          Bright Data REST wrapper — built, on hold (see status below)
    pipeline.py                    shared gather -> extract -> synthesize helper + ScrapeCache-backed caching
```

Every module endpoint follows the same pattern: **gather** (web search, cached in `ScrapeCache` so repeat calls don't redo work) → **extract** (cheap AIML model turns raw results into structured facts) → **synthesize** (reasoning AIML model turns facts + profile context into the module's final output, persisted against the shared `StartupProfile`).

**Frontend** — Next.js 16 (App Router, TypeScript, Tailwind):

```
frontend/src/
  app/
    page.tsx                dashboard: 4 module cards + live profile summary
    idea/page.tsx             Idea Brainstorming form + idea cards
    market/page.tsx            Market Research form + TAM/SAM/SOM + competitors + KPIs
    cofounder/page.tsx           Cofounder Search form + match cards
    investor/page.tsx             Investor Search + lead cards
    layout.tsx               wraps app in ProfileProvider + Nav
  components/nav.tsx        top nav, shows current profile domain
  lib/
    api.ts                    typed client for the backend
    profile-context.tsx        creates/loads one StartupProfile per browser (localStorage id), no auth
```

## Data source status

- **AIML API**: live and working — `AIML_API_KEY` is set, used for every extract/synthesize call.
- **Bright Data**: on hold. The account needs payment verification (card or PayPal) to unlock Web Unlocker/zone creation, which we're deliberately not doing right now. `brightdata_client.py` is fully written (REST calls for Web Unlocker/SERP/Datasets) and left in place, but nothing currently calls it.
- **Current web data source**: `free_data_client.py` — DuckDuckGo HTML search (no key, no card) plus plain page fetch. All 4 routers import `web_client.py`, which is a one-line facade currently pointed at `free_data_client`. Swapping back to Bright Data later means changing that one import, not touching the routers.
- **DB**: SQLite, deliberately deferred — a Postgres (or other) swap was discussed and postponed; the SQLAlchemy models transfer as-is, it's a connection-string change when that happens.

## Verified working (live, not just code review)

- Backend imports cleanly, all routes registered, DB reads/writes confirmed via `/profile` CRUD.
- CORS confirmed permitting `http://localhost:3000`.
- Frontend type-checks clean (`tsc --noEmit`) and production-builds clean (`next build`).
- **Market Research** (`POST /market/research`) run live end-to-end: real DuckDuckGo search results fed through AIML extraction/synthesis produced an actual TAM/SAM/SOM estimate and named competitors (Gartner, Big Mile) for a test idea.
- **Idea Brainstorming** (`POST /idea/generate`) run live end-to-end: produced 4 idea cards grounded in real cited sources (JPMorgan, Forbes, Wolters Kluwer) for a test domain.
- Cofounder Search and Investor Search use the identical gather→extract→synthesize pattern (same `web_client.search_engine` call) but haven't been exercised live yet — next thing worth testing.

## Run commands

**Backend**
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # then fill in AIML_API_KEY (BRIGHTDATA_* can stay blank for now)
uvicorn app.main:app --reload --port 8000
```
Health check: `curl http://localhost:8000/health`. Interactive API docs at `http://localhost:8000/docs`.

**Frontend**
```
cd frontend
npm install
npm run dev
```
Opens at `http://localhost:3000`. Talks to the backend via `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` (defaults to `http://localhost:8000`).

Run both at once for the full app.

## Open items / next up

- Exercise Cofounder Search and Investor Search live (same pattern as Market/Idea, just not yet manually tested).
- Decide and wire up a real DB (Postgres via Neon/Supabase or otherwise) when ready — deferred for now.
- If Bright Data's payment verification gets sorted later, swap `web_client.py`'s import from `free_data_client` to `brightdata_client` and fill in the `DATASET_IDS` (LinkedIn/Crunchbase) in `brightdata_client.py`.
- No auth yet — one implicit profile per browser via localStorage, fine for a demo, not for real users.
