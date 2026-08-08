# Phase 1 — What's Built

Status snapshot of the technical implementation so far. Background/rationale docs: [ideas.md](./ideas.md) (product brainstorm), [bright-data.md](./bright-data.md) (Bright Data reference, currently on hold), [technical-plan.md](./technical-plan.md) (architecture plan this was built against).

## What's implemented

**Backend** — Express 5 + TypeScript (Node 20+), Postgres on Supabase via Drizzle ORM, all 4 modules wired end-to-end:

```
backend/src/
  index.ts                server entrypoint (listen + graceful shutdown)
  app.ts                   express app, CORS, router registration, /health
  config.ts                 env-driven settings
  schemas.ts                 zod request validation
  serialize.ts                row -> response body (pins the JSON shape the frontend expects)
  db/
    schema.ts                 Drizzle tables: StartupProfile, IdeaCard, MarketReport, CofounderMatch, InvestorLead, ScrapeCache
    index.ts                   postgres-js connection + drizzle instance
  http/errors.ts           HttpError + error middleware (FastAPI-style `{detail}` bodies)
  routes/
    profile.ts                POST/GET/PATCH /profile — Startup Profile CRUD
    idea.ts                     POST /idea/generate
    market.ts                    POST /market/research
    cofounder.ts                  POST /cofounder/search
    investor.ts                    POST /investor/search
  services/
    aimlClient.ts              AIML API wrapper (OpenAI-compatible client, fast vs reasoning model split)
    webClient.ts                 facade the routes actually import for web data
    freeDataClient.ts             DuckDuckGo HTML search + plain page fetch — no signup, in use now
    brightdataClient.ts           Bright Data REST wrapper — built, on hold (see status below)
    pipeline.ts                    shared gather -> extract -> synthesize helper + ScrapeCache-backed caching
    profiles.ts                     shared profile lookup/update helpers
backend/drizzle/            generated SQL migrations (0000_init.sql creates all 6 tables)
```

Originally built as a FastAPI/SQLite service and ported to Express/TypeScript with the HTTP contracts unchanged — the frontend's `lib/api.ts` was not touched.

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
- **Bright Data**: on hold. The account needs payment verification (card or PayPal) to unlock Web Unlocker/zone creation, which we're deliberately not doing right now. `brightdataClient.ts` is fully written (REST calls for Web Unlocker/SERP/Datasets) and left in place, but nothing currently calls it.
- **Current web data source**: `freeDataClient.ts` — DuckDuckGo HTML search (no key, no card) plus plain page fetch. All 4 routes import `webClient.ts`, which is a one-line facade currently pointed at `freeDataClient`. Swapping back to Bright Data later means changing that one import, not touching the routes.
- **DB**: Postgres on Supabase. Schema is defined in `src/db/schema.ts`; `npm run db:generate` writes the SQL to `drizzle/` and `npm run db:migrate` applies it (or paste `drizzle/0000_init.sql` into the Supabase SQL editor).

## Verified working (live, not just code review)

- Backend imports cleanly, all routes registered, DB reads/writes confirmed via `/profile` CRUD.
- CORS confirmed permitting `http://localhost:3000`.
- Frontend type-checks clean (`tsc --noEmit`) and production-builds clean (`next build`).
- **Market Research** (`POST /market/research`) run live end-to-end: real DuckDuckGo search results fed through AIML extraction/synthesis produced an actual TAM/SAM/SOM estimate and named competitors (Gartner, Big Mile) for a test idea.
- **Idea Brainstorming** (`POST /idea/generate`) run live end-to-end: produced 4 idea cards grounded in real cited sources (JPMorgan, Forbes, Wolters Kluwer) for a test domain.
- Cofounder Search and Investor Search use the identical gather→extract→synthesize pattern (same `webClient.searchEngine` call) but haven't been exercised live yet — next thing worth testing.
- Post-port re-verification (Express/TypeScript, against a scratch Postgres): `tsc --noEmit` clean, `/health` ok, `/profile` create → get → patch round-trip, 404 on unknown/malformed ids, 422 on invalid bodies, and the gather step writing real DuckDuckGo results into `scrape_cache`. The AIML-dependent halves of the 4 modules still need a live re-run with a real key.

## Run commands

**Backend**
```
cd backend
npm install
copy .env.example .env      # then fill in AIML_API_KEY + DATABASE_URL (BRIGHTDATA_* can stay blank for now)
npm run db:migrate          # creates the 6 tables in Supabase
npm run dev
```
Health check: `curl http://localhost:8000/health`.

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
- If Bright Data's payment verification gets sorted later, swap `webClient.ts`'s import from `freeDataClient` to `brightdataClient` and fill in the `DATASET_IDS` (LinkedIn/Crunchbase) in `brightdataClient.ts`.
- No auth yet — one implicit profile per browser via localStorage, fine for a demo, not for real users.
