# One Place for Startups — native.builder edition

The same app, reshaped to what native.builder runs: a Vite + React frontend and
Supabase Edge Functions instead of an Express server. Your four pages, nav, and
profile context came across as-is; only their imports changed.

Verified: `tsc --noEmit` + `vite build` clean (38 modules), and all 10 Edge
Function files pass `deno check`.

## Setup, in order

### 1. Database

Supabase → **SQL Editor** → paste [`supabase/schema.sql`](./supabase/schema.sql) → Run.

Creates 6 tables, indexes, an `updated_at` trigger, and enables RLS with **no
policies** — anon is denied outright. The Edge Functions use the service-role
key, which bypasses RLS, so nothing reachable from a browser can read a row.

### 2. Edge Function secrets

Template: [`supabase/functions/.env.example`](./supabase/functions/.env.example)

Set them in Supabase → **Edge Functions → Secrets**, or:

```bash
supabase secrets set --env-file supabase/functions/.env
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically —
don't set those yourself.

**There are two env files, and the split is deliberate:**

| File | Goes where | Holds | Public? |
|---|---|---|---|
| [`.env.example`](./.env.example) | native.builder project env | Supabase URL + anon key | ✅ ships in the bundle |
| [`supabase/functions/.env.example`](./supabase/functions/.env.example) | Supabase Edge Function secrets | AI/ML key, Bright Data token | ❌ server-side only |

Never move `AIML_API_KEY` into the frontend file. Anything `VITE_`-prefixed is
compiled into the public JS bundle, and keeping that key server-side is the
main reason these functions exist.

### 3. Deploy the functions

```bash
supabase functions deploy profile idea market cofounder investor
```

Or paste each one in the dashboard (**Edge Functions → Deploy a new function**),
naming them `profile`, `idea`, `market`, `cofounder`, `investor`. `_shared/` is
not a function — the leading underscore keeps it from being deployed as one.

### 4. Frontend

Paste `src/` and `public/` into the native.builder project, add the two env
vars from [`.env.example`](./.env.example), and add no dependencies — the app
uses only React and Tailwind.

## Endpoints

| Endpoint | Body | Returns |
|---|---|---|
| `POST /functions/v1/profile` | `{owner_id}` | profile |
| `GET /functions/v1/profile/:id` | — | profile |
| `PATCH /functions/v1/profile/:id` | partial profile | profile |
| `POST /functions/v1/idea` | `{profile_id, domain, interests}` | `{idea_cards}` |
| `POST /functions/v1/market` | `{profile_id, idea_text}` | `{market_report}` |
| `POST /functions/v1/cofounder` | `{profile_id, founder_profile, desired_complement}` | `{matches}` |
| `POST /functions/v1/investor` | `{profile_id}` | `{leads}` |

Errors come back as `{ "detail": "..." }`, the same shape the pages already parse.

## How a module works

Every one runs the same three steps, server-side:

1. **gather** — DuckDuckGo search, cached in `scrape_cache` by `sha256(tool + query)`
2. **extract** — fast model turns raw results into structured facts
3. **synthesize** — reasoning model turns facts + profile into the output, saved
   against `profile_id` and returned with citations

The profile is the spine: Idea writes `domain`, Market writes `idea_text`,
Investor reads both back and refuses with a clear message if `domain` is unset.

## Two things worth knowing

- **Fence stripping is load-bearing.** The fast model wraps JSON in ` ```json `
  fences; a bare `JSON.parse` swallows the whole extraction and synthesis then
  reasons over garbage. That single bug produced 0 investor leads and 0
  citations before it was found. See `parseJson` in `_shared/pipeline.ts`.
- **Cofounder search often returns nothing.** Public search results describe
  cofounder matching rather than listing people. Real candidates need the
  LinkedIn people-search dataset (Bright Data), which isn't connected. The
  model is told to return `[]` rather than invent names, and the UI says so.

## What changed from the Next.js version

| | Before | After |
|---|---|---|
| Routing | `app/idea/page.tsx` | `pages/Idea.tsx` + `lib/router.tsx` |
| Links | `next/link`, `usePathname` | `Link`, `useRouter` from `lib/router` |
| Client marker | `"use client"` | not needed |
| Layout | `app/layout.tsx` | `App.tsx` |
| Backend | `localhost:8000` | `{SUPABASE_URL}/functions/v1` |
| Fonts | `next/font` (Geist) | system font stack |

Page JSX is otherwise untouched, Tailwind classes included.
