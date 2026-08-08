# Technical Plan & Project Flow

Concrete build plan, now that [ideas.md](./ideas.md) has the product brainstorm and [bright-data.md](./bright-data.md) has the Bright Data MCP tool inventory. This doc is what we're actually coding against.

## 1. Final tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast to build a polished, demo-ready UI; App Router gives simple server actions for calling our own API |
| Backend | Express 5 + TypeScript (Node 20+) | One language across the stack — the frontend's API types and the backend's response shapes stay in sync by hand-off, not translation; async-native for parallel scrape calls |
| DB | Postgres on Supabase via Drizzle ORM | Managed Postgres with zero server setup, and a real DB from day one (no SQLite → Postgres migration later). Schema lives in `backend/src/db/schema.ts`; `drizzle-kit` generates the SQL in `backend/drizzle/` |
| LLM access | AIML API, OpenAI-compatible client, `base_url=https://api.aimlapi.com/v1` | One key, pick different models per task by name |
| Web data | **Currently:** free, no-signup sources (DuckDuckGo HTML search, plain page fetch) via `webClient.ts`. **Later:** Bright Data direct REST calls, functions named 1:1 with the MCP tool names | Bright Data is on hold behind a payment-verification step on the account — see [bright-data.md](./bright-data.md). `webClient.ts` is a facade so swapping back is a one-line import change, not a rewrite of the routes. |

AIML API usage pattern — OpenAI-compatible client:
```ts
import OpenAI from "openai";
const client = new OpenAI({ baseURL: "https://api.aimlapi.com/v1", apiKey: AIML_API_KEY });
await client.chat.completions.create({ model: "<model-name>", messages: [...] });
```
We'll pick a **fast/cheap model** for structured extraction passes and a **stronger reasoning model** for synthesis passes (idea generation, market sizing, ranking) — exact model names to be decided once we see what's available on the account (AIML API exposes 200+ models under one key).

## 2. Repo layout

```
/frontend                Next.js app
  /app
    /idea                Idea Brainstorming flow
    /market               Market Research flow
    /cofounder             Cofounder Search flow
    /investor               Investor Search flow
    /profile                 Startup Profile view (shared sidebar/state)
  /components
  /lib/api.ts             thin client for calling our Express backend

/backend                  Express + TypeScript app
  /src
    index.ts               server entrypoint (listen + graceful shutdown)
    app.ts                  express app, CORS, router registration
    config.ts                env vars
    schemas.ts                zod request validation
    serialize.ts               row -> response body (pins the JSON shape the frontend expects)
    /routes
      profile.ts              /profile CRUD
      idea.ts                  /idea/generate
      market.ts                 /market/research
      cofounder.ts                /cofounder/search
      investor.ts                  /investor/search
    /services
      aimlClient.ts           AIML API wrapper (chat)
      webClient.ts             facade routes actually import -- currently points at freeDataClient
      freeDataClient.ts         DuckDuckGo search + plain page fetch (no signup, in use now)
      brightdataClient.ts       Bright Data REST wrapper (on hold, swap webClient's import to this later)
      pipeline.ts                shared cached "extract then reason" two-pass helper
      profiles.ts                 shared profile lookup/update helpers
    /db
      schema.ts               Drizzle tables (startup_profiles, idea_cards, market_reports, cofounder_matches, investor_leads, scrape_cache)
      index.ts                 postgres-js connection + drizzle instance
    /http/errors.ts        HttpError + error middleware
  /drizzle                 generated SQL migrations
  drizzle.config.ts
  package.json
  tsconfig.json
  .env.example

ideas.md
bright-data.md
technical-plan.md
```

## 3. Data model (DB schema, Drizzle / Postgres)

Mirrors the shared Startup Profile from `ideas.md`, normalized into tables:

- **StartupProfile**: id, owner_id, domain, idea_text, stage, target_market, founder_skills (JSON), time_commitment, budget, created_at, updated_at
- **IdeaCard**: id, profile_id (FK), problem, solution, why_now, business_model, source_citations (JSON)
- **MarketReport**: id, profile_id (FK), tam, sam, som, methodology_notes, competitors (JSON), kpis (JSON), source_citations (JSON)
- **CofounderMatch**: id, profile_id (FK), name, headline, profile_url, match_rationale, skill_tags (JSON)
- **InvestorLead**: id, profile_id (FK), firm, person, thesis_summary, portfolio_highlights (JSON), outreach_angle, source_url
- **ScrapeCache**: id, cache_key (url+query hash), tool_name, raw_response (JSON), fetched_at — avoids burning Bright Data credits on repeat calls during dev/demo

Ids are Postgres `uuid` (`gen_random_uuid()`), JSON columns are `jsonb`, timestamps are `timestamptz` defaulted by the database. Child tables cascade-delete with their profile.

## 4. API contracts (backend)

```
GET/POST/PATCH  /profile/{id}          Startup Profile CRUD

POST /idea/generate
  in:  { profile_id, domain?, interests?, answers_to_clarifying_qs? }
  out: { idea_cards: IdeaCard[] }

POST /market/research
  in:  { profile_id, idea_text }
  out: { market_report: MarketReport }

POST /cofounder/search
  in:  { profile_id, founder_profile, desired_complement }
  out: { matches: CofounderMatch[] }

POST /investor/search
  in:  { profile_id }              # reads domain/stage/tam from profile's market_report
  out: { leads: InvestorLead[] }
```

Every generate/research/search endpoint follows the same two-pass internal pipeline:
1. **Gather** — call the relevant Bright Data tool(s) (see module→tool mapping in `bright-data.md`), write raw results to `ScrapeCache`.
2. **Extract** — cheap AIML model turns raw scrape results into structured facts.
3. **Synthesize** — stronger AIML model turns structured facts + profile context into the final module output, and the endpoint persists it against `profile_id` and returns it with `source_citations` intact.

## 5. Build order

1. Backend skeleton: Express app, DB schema/migrations, `/profile` CRUD, health check. Confirms the spine works before any AI/scraping calls.
2. `aimlClient.ts` + `brightdataClient.ts` service wrappers with the smallest possible working call each (one chat completion, one `searchEngine` call) — prove both third-party integrations work end-to-end before building module logic on top.
3. Market Research module (highest demo value, lowest data-availability risk — see `ideas.md` §5).
4. Idea Brainstorming module (reuses the gather→extract→synthesize pipeline from #3).
5. Frontend: profile sidebar + Market Research + Idea flows wired to the backend.
6. Investor Search module (same pipeline pattern again).
7. Cofounder Search module — de-risked now that `web_data_linkedin_people_search` / `web_data_linkedin_person_profile` exist (see `bright-data.md`), but build last since it's still the newest pattern (people-matching vs. company/market data).
8. Polish pass: loading states, error handling for scrape failures/empty results, demo script.

## 6. Environment variables

`backend/.env`:
```
AIML_API_KEY=
BRIGHTDATA_API_TOKEN=
BRIGHTDATA_WEB_UNLOCKER_ZONE=mcp_unlocker
# Supabase -> Project Settings -> Database -> Connection string (Transaction pooler, port 6543)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
PORT=8000
CORS_ORIGIN=http://localhost:3000
```

`frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 7. Local dev

```
# backend
cd backend
npm install
cp .env.example .env      # fill in AIML_API_KEY + DATABASE_URL
npm run db:migrate        # creates the tables in Supabase
npm run dev               # http://localhost:8000

# frontend
cd frontend
npm install
npm run dev
```

## 8. Open items

- Confirm which AIML API models are actually enabled on the hackathon credit grant, and pick the "fast" vs "reasoning" model names accordingly.
- Confirm Bright Data account has `PRO_MODE`/LinkedIn tool access (flagged as an open item in `bright-data.md`).
- Decide auth: for a hackathon demo, a single implicit user (no login) is probably fine — one StartupProfile per browser session via a cookie or local-storage id — rather than building real auth.
