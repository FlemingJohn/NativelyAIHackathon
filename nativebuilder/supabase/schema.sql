-- ============================================================================
-- One Place for Startups -- Supabase schema
-- Paste this whole file into: Supabase dashboard -> SQL Editor -> New query -> Run
-- ============================================================================
-- Mirrors the Drizzle schema from the Express backend.
--
-- SECURITY: the browser never touches these tables. Every read and write goes
-- through an Edge Function using the service-role key, which bypasses RLS. So
-- RLS is enabled with NO policies at all -- that denies anon and authenticated
-- outright, which is exactly what we want. Nothing reachable with the public
-- anon key can read a single row.
--
-- If you ever want the browser to query Supabase directly, that's the moment to
-- add Supabase Auth and policies scoped with `auth.uid() = owner_id` -- not a
-- blanket `using (true)`.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto; Supabase enables it by default, this is
-- just a safety net for a fresh project.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables ----

create table if not exists public.startup_profiles (
  id              uuid primary key default gen_random_uuid(),
  owner_id        text        not null,
  domain          text,
  idea_text       text,
  stage           text,
  target_market   text,
  founder_skills  jsonb       not null default '{}'::jsonb,
  time_commitment text,
  budget          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.idea_cards (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid        not null references public.startup_profiles(id) on delete cascade,
  problem          text        not null,
  solution         text        not null,
  why_now          text        not null,
  business_model   text        not null,
  source_citations jsonb       not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.market_reports (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid        not null references public.startup_profiles(id) on delete cascade,
  tam               text,
  sam               text,
  som               text,
  methodology_notes text,
  competitors       jsonb       not null default '[]'::jsonb,
  kpis              jsonb       not null default '[]'::jsonb,
  source_citations  jsonb       not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

create table if not exists public.cofounder_matches (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid        not null references public.startup_profiles(id) on delete cascade,
  name            text        not null,
  headline        text,
  profile_url     text,
  match_rationale text        not null,
  skill_tags      jsonb       not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create table if not exists public.investor_leads (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid        not null references public.startup_profiles(id) on delete cascade,
  firm                 text        not null,
  person               text,
  thesis_summary       text,
  portfolio_highlights jsonb       not null default '[]'::jsonb,
  outreach_angle       text,
  source_url           text,
  created_at           timestamptz not null default now()
);

-- Keeps repeat demo runs off the search endpoint (and off Bright Data credits).
create table if not exists public.scrape_cache (
  id           uuid primary key default gen_random_uuid(),
  cache_key    text        not null unique,
  tool_name    text        not null,
  raw_response jsonb       not null,
  fetched_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- indexes ----

create index if not exists ix_startup_profiles_owner_id  on public.startup_profiles (owner_id);
create index if not exists ix_idea_cards_profile_id       on public.idea_cards (profile_id);
create index if not exists ix_market_reports_profile_id   on public.market_reports (profile_id);
create index if not exists ix_cofounder_matches_profile_id on public.cofounder_matches (profile_id);
create index if not exists ix_investor_leads_profile_id   on public.investor_leads (profile_id);
create index if not exists ix_scrape_cache_cache_key      on public.scrape_cache (cache_key);

-- ------------------------------------------------- updated_at maintenance ---
-- The Express backend stamped updated_at in code; in Supabase the browser
-- writes directly, so a trigger is the only place that can't be bypassed.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_startup_profiles_updated_at on public.startup_profiles;
create trigger trg_startup_profiles_updated_at
  before update on public.startup_profiles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------- RLS ----

alter table public.startup_profiles  enable row level security;
alter table public.idea_cards        enable row level security;
alter table public.market_reports    enable row level security;
alter table public.cofounder_matches enable row level security;
alter table public.investor_leads    enable row level security;
alter table public.scrape_cache      enable row level security;

-- Deliberately no policies: RLS on + zero policies = deny everything for anon
-- and authenticated. The Edge Functions use the service-role key, which is not
-- subject to RLS, so they keep working. Drop any permissive policy left over
-- from an earlier run.
do $$
declare
  t text;
begin
  foreach t in array array[
    'startup_profiles', 'idea_cards', 'market_reports',
    'cofounder_matches', 'investor_leads', 'scrape_cache'
  ]
  loop
    execute format('drop policy if exists demo_all_access on public.%I', t);
  end loop;
end;
$$;
