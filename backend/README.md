# Backend — Express + TypeScript

API for **One Place for Startups**. Express 5 + TypeScript, Drizzle ORM against
Supabase Postgres. Ported from the original FastAPI service; the HTTP contracts
are unchanged, so `frontend/src/lib/api.ts` works against it as-is.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
```

`DATABASE_URL` comes from Supabase → **Project Settings → Database → Connection
string**. Use the **Transaction pooler** URI (port 6543) for the running server.

## Create the schema

```bash
npm run db:migrate        # applies drizzle/*.sql to the database in DATABASE_URL
```

If the pooler blocks DDL, paste `drizzle/0000_init.sql` into the Supabase SQL
editor instead — it's plain Postgres DDL.

After changing `src/db/schema.ts`, generate a new migration and apply it:

```bash
npm run db:generate
npm run db:migrate
```

## Run

```bash
npm run dev               # tsx watch, http://localhost:8000
npm run typecheck
npm run build && npm start
```

## Layout

```
src/
  index.ts              server entrypoint
  app.ts                express app, CORS, router registration
  config.ts             env vars
  schemas.ts            zod request validation (was pydantic)
  serialize.ts          row -> response body (was FastAPI response_model)
  db/
    index.ts            postgres-js connection + drizzle instance
    schema.ts           table definitions
  http/errors.ts        HttpError + error middleware
  routes/               profile, idea, market, cofounder, investor
  services/
    aimlClient.ts       AIML API (OpenAI-compatible)
    webClient.ts        facade -> freeDataClient (swap to brightdataClient later)
    freeDataClient.ts   DuckDuckGo search + page fetch
    brightdataClient.ts Bright Data REST (on hold, see bright-data.md)
    pipeline.ts         cached gather -> extract -> synthesize
    profiles.ts         shared profile lookup/update helpers
drizzle/                generated SQL migrations
```

## Endpoints

```
GET    /health
POST   /profile
GET    /profile/:id
PATCH  /profile/:id
POST   /idea/generate
POST   /market/research
POST   /cofounder/search
POST   /investor/search
```

Errors come back as `{ "detail": "..." }` (422 carries zod issues), matching
what the frontend already parses.
