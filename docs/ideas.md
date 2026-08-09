# Project Ideas — "One Place for Startups"

Hackathon: lablab.ai NativelyAI. Sponsor tech: **AIML API** (unified access to many LLMs, one key, tool/function calling) + **Bright Data** (web scraping — SERP API, Web Unlocker, Datasets marketplace, and their MCP server for agent tool-calling).

## 1. Product vision

A single workspace that carries a founder from "I have a vague idea" to "I have a pitch-ready plan, a cofounder lead, and an investor list." The unlock isn't any one module — it's that **all four modules share one evolving Startup Profile**, so each step gets smarter using what the previous step learned. That's the "one place" pitch, and it's also the thing that makes the demo compelling (a single continuous narrative instead of four disconnected tools).

Four modules:
1. **Idea Brainstorming** — no idea yet → guided Q&A → AI + web-signal-sourced idea suggestions.
2. **Market Research** — has an idea → TAM/SAM/SOM, competitors, KPIs.
3. **Cofounder Search** — has a gap (e.g. technical founder needs business co-founder) → matched candidates.
4. **Investor Search** — has a plan → matched investors for domain/stage + fetched details.

## 2. Shared data model: the Startup Profile

This is the spine that ties the four modules together. Every module reads from it and writes back to it.

```
StartupProfile {
  id, ownerId, createdAt, updatedAt
  domain              // e.g. "climate fintech"
  ideaText            // one-liner + longer description
  stage               // idea / validating / building / raising
  targetMarket        // geography, customer segment
  founderProfile       { skills: [], background: technical|business|design, timeCommitment, budget }
  skillGaps            []   // filled in by cofounder module logic, informed by market research
  marketReport         { tam, sam, som, competitors: [], kpis: [] }
  cofounderMatches      []
  investorMatches       []
  sourceCitations       []  // every scraped fact keeps its source URL — critical for trust/demo
}
```

Concretely: Idea module writes `domain`/`ideaText`. Market Research reads those, writes `marketReport`, and infers `skillGaps` (e.g. "competitors all have strong ML teams, you don't"). Cofounder Search reads `skillGaps` + `founderProfile` to bias matching. Investor Search reads `domain` + `stage` + `marketReport.tam` to filter investors who write checks in that space/size.

## 3. Module details

### 3.1 Idea Brainstorming
- **Trigger**: user has no concrete idea, wants direction.
- **Flow**: chat-style clarifying questions first (domain/industry, personal interests or expertise, problem they've personally felt, risk appetite, time horizon) — don't generate until you have enough signal, 3-5 questions max so it doesn't feel like a form.
- **Bright Data use**: pull "what's hot" signal — Google Trends, Reddit (r/startups, r/SaaS, niche subreddits for the domain), ProductHunt launches, Hacker News "Show HN", YC's public "Requests for Startups". SERP API for recent news in the domain.
- **AIML API use**: one pass to structure the scraped signal into candidate problem spaces, a second (stronger reasoning model) pass to turn each into a pitch-shaped idea card: problem, proposed solution, why-now, rough business model.
- **Output**: 3-5 idea cards, each with a "why this idea, right now" rationale citing the scraped source (not just vibes) — this citation habit is what makes it feel trustworthy instead of a generic LLM guess.

### 3.2 Market Research
- **Trigger**: user has an idea (either typed in directly, or picked from module 1).
- **Flow**: confirm/refine the idea in one line, then run research automatically — this should feel instant/automatic, not another Q&A.
- **Bright Data use**: SERP search for competitors + funding news, scrape competitor sites/pricing pages, scrape market-size reports/news mentions for TAM signal.
- **AIML API use**: extraction model to pull structured facts (pricing, feature sets, funding rounds) from scraped pages; reasoning model to synthesize TAM/SAM/SOM estimate (clearly labeled as an *estimate*, with the sourced data points shown) and a competitor comparison table.
- **Output**: competitor table, TAM/SAM/SOM with methodology shown, suggested KPIs to track (e.g. CAC, activation rate — chosen based on business model type, not generic).

### 3.3 Cofounder Search
- **Trigger**: after market research (or anytime), when a gap is identified — e.g. technical founder needs a GTM/business cofounder.
- **Flow**: confirm the founder's own profile (technical/business/design, skills, availability) → search runs against the *complementary* profile.
- **Important constraint to flag now**: LinkedIn is not scrapable under Bright Data's compliant usage (LinkedIn actively blocks and it's ToS/legal-sensitive). Realistic sources: Bright Data's **Datasets marketplace** (pre-licensed structured datasets, if a founder/people dataset exists there), public GitHub profiles + bios (technical cofounders), AngelList/Wellfound public profiles, X/Twitter bios, YC's public "cofounder matching" style directories if any are public. For the hackathon demo, a small curated/seeded dataset of mock profiles is a legitimate fallback if live sourcing is thin — be upfront in the demo about what's live-scraped vs seeded.
- **AIML API use**: embedding model to match founder skill-vector against candidate profiles; reasoning model to write a one-line "why this match" per candidate.
- **Output**: ranked candidate cards with complementary-skill rationale.

### 3.4 Investor Search
- **Trigger**: after market research exists (domain + stage known).
- **Bright Data use**: SERP + scrape VC firm "portfolio" and "thesis" pages, Crunchbase-style public pages, AngelList/Wellfound public investor profiles — filter by domain and check-size/stage language found on their sites.
- **AIML API use**: reasoning model ranks investors by thesis-fit against the Startup Profile, drafts a short personalized outreach angle per investor (references something real about their portfolio/thesis, not generic).
- **Output**: investor list with firm, stated thesis, relevant portfolio companies, and a drafted outreach angle.

## 4. Architecture sketch

```
Frontend (Next.js + Tailwind)
  - Single dashboard: 4 module cards + persistent Startup Profile sidebar
  - Each module = guided flow, not a blank chat box (more demo-reliable than a free-form agent)

Backend (Express + TypeScript — one language across the stack, and both AIML API and Bright Data are plain HTTP)
  - /profile        CRUD on StartupProfile (Postgres/Supabase)
  - /idea/generate   -> Bright Data signal pull -> AIML API synth -> idea cards
  - /market/research -> Bright Data scrape -> AIML API extract+synth -> market report
  - /cofounder/search -> Bright Data/dataset lookup -> AIML API embed+rank -> matches
  - /investor/search -> Bright Data scrape -> AIML API rank+draft -> investor list
  - Each module = "extract (cheap/fast model) then reason (strong model)" two-pass pattern —
    keeps cost/latency down on free credits and keeps outputs grounded in real scraped facts

Storage: Postgres/Supabase for StartupProfile + cached scrape results (avoid re-scraping/re-spending credits on repeat demo runs)
```

Consider looking at **Bright Data's MCP server** — if it plugs directly into AIML API's function-calling, that's a genuinely "AI-native" story for the judges (tool-calling agent literally reaching for the web), and worth demoing as a technical highlight even if the guided-flow UI is what carries the actual demo reliability.

## 5. Suggested build priority (hackathons are time-boxed)

1. **Market Research** first — most demoable, clearest Bright Data + AIML synergy, no data-availability problem.
2. **Idea Brainstorming** second — reuses the same scrape→synthesize pipeline, different sources/prompt.
3. **Investor Search** third — same pipeline pattern again (scrape→rank→draft), so it's mostly reuse once #1 works.
4. **Cofounder Search** last, and scope it down — this is the one with a real data-sourcing problem (no compliant LinkedIn access), so it's the highest risk of eating time for a weak result. A smaller seeded-dataset version that's honest about its limits beats an over-scoped live-scraping version that breaks on stage.

Given typical hackathon time, I'd honestly suggest building #1 and #2 deeply and polished, #3 as a lighter reuse of the same pipeline, and #4 as the smallest honest version — rather than four shallow modules. Open to doing all four if the timeline supports it.

## 6. Open questions for you

- Team size / time budget for this build — shapes how many of the 4 modules are realistic to ship well.
- Do you already have AIML API + Bright Data keys/credits provisioned, or is that still pending?
- Any preference on frontend stack, or is Next.js/Tailwind fine?
- For cofounder search — okay with a seeded/mock dataset for the demo (clearly labeled), or is live sourcing a hard requirement?
- Should the four modules be presented as a guided linear flow (idea → market → cofounder → investor) or as four independent entry points a user can jump into in any order?
