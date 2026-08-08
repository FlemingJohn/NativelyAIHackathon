# Technical Plan & Project Flow

Concrete build plan, now that [ideas.md](./ideas.md) has the product brainstorm and [bright-data.md](./bright-data.md) has the Bright Data MCP tool inventory. This doc is what we're actually coding against.

## 1. Final tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast to build a polished, demo-ready UI; App Router gives simple server actions for calling our own API |
| Backend | FastAPI (Python 3.12) | Best fit for calling both AIML API (OpenAI-compatible client) and Bright Data REST endpoints; async-native for parallel scrape calls |
| DB | SQLite via SQLAlchemy for local dev | Zero setup for a hackathon; deliberately staying on SQLite for now (DB choice/signup deferred), models written so swapping to Postgres later is a connection-string change, not a rewrite |
| LLM access | AIML API, OpenAI-compatible client, `base_url=https://api.aimlapi.com/v1` | One key, pick different models per task by name |
| Web data | **Currently:** free, no-signup sources (DuckDuckGo HTML search, plain page fetch) via `web_client.py`. **Later:** Bright Data direct REST calls, functions named 1:1 with the MCP tool names | Bright Data is on hold behind a payment-verification step on the account — see [bright-data.md](./bright-data.md). `web_client.py` is a facade so swapping back is a one-line import change, not a rewrite of the routers. |

AIML API usage pattern — OpenAI-compatible client:
```python
from openai import OpenAI
client = OpenAI(base_url="https://api.aimlapi.com/v1", api_key=AIML_API_KEY)
client.chat.completions.create(model="<model-name>", messages=[...])
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
  /lib/api.ts             thin client for calling our FastAPI backend

/backend                  FastAPI app
  /app
    main.py                app entrypoint, router registration
    /routers
      profile.py            /profile CRUD
      idea.py                /idea/generate
      market.py               /market/research
      cofounder.py              /cofounder/search
      investor.py                /investor/search
    /services
      aiml_client.py          AIML API wrapper (chat + embeddings)
      web_client.py            facade routers actually import -- currently points at free_data_client
      free_data_client.py       DuckDuckGo search + plain page fetch (no signup, in use now)
      brightdata_client.py      Bright Data REST wrapper (on hold, swap web_client's import to this later)
      pipeline.py                shared "extract then reason" two-pass helper
    /models                   SQLAlchemy models (StartupProfile, IdeaCard, MarketReport, CofounderMatch, InvestorLead)
    /db.py                    SQLAlchemy session/engine setup
  requirements.txt
  .env.example

ideas.md
bright-data.md
technical-plan.md
```

## 3. Data model (DB schema, SQLAlchemy)

Mirrors the shared Startup Profile from `ideas.md`, normalized into tables:

- **StartupProfile**: id, owner_id, domain, idea_text, stage, target_market, founder_skills (JSON), time_commitment, budget, created_at, updated_at
- **IdeaCard**: id, profile_id (FK), problem, solution, why_now, business_model, source_citations (JSON)
- **MarketReport**: id, profile_id (FK), tam, sam, som, methodology_notes, competitors (JSON), kpis (JSON), source_citations (JSON)
- **CofounderMatch**: id, profile_id (FK), name, headline, profile_url, match_rationale, skill_tags (JSON)
- **InvestorLead**: id, profile_id (FK), firm, person, thesis_summary, portfolio_highlights (JSON), outreach_angle, source_url
- **ScrapeCache**: id, cache_key (url+query hash), tool_name, raw_response (JSON), fetched_at — avoids burning Bright Data credits on repeat calls during dev/demo

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

1. Backend skeleton: FastAPI app, DB models/migrations, `/profile` CRUD, health check. Confirms the spine works before any AI/scraping calls.
2. `aiml_client.py` + `brightdata_client.py` service wrappers with the smallest possible working call each (one chat completion, one `search_engine` call) — prove both third-party integrations work end-to-end before building module logic on top.
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
DATABASE_URL=sqlite:///./app.db
```

`frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 7. Local dev

```
# backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
npm run dev
```

## 8. Open items

- Confirm which AIML API models are actually enabled on the hackathon credit grant, and pick the "fast" vs "reasoning" model names accordingly.
- Confirm Bright Data account has `PRO_MODE`/LinkedIn tool access (flagged as an open item in `bright-data.md`).
- Decide auth: for a hackathon demo, a single implicit user (no login) is probably fine — one StartupProfile per browser session via a cookie or local-storage id — rather than building real auth.
