-- AICOS initial schema (MVP)
-- Postgres + pgvector. Mirrors packages/shared-types/src/index.ts.
-- Apply with: supabase db push  (or psql -f against DATABASE_URL)

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type platform as enum ('instagram', 'youtube');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum (
    'instagram_caption', 'instagram_reel_script',
    'youtube_short_script', 'youtube_description'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum (
    'draft', 'pending_approval', 'approved', 'rejected',
    'scheduled', 'published', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type publication_status as enum (
    'queued', 'scheduled', 'publishing', 'published', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type model_tier as enum ('local', 'mid', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type budget_scope as enum ('global', 'agent', 'platform');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Brand / config
-- ---------------------------------------------------------------------------
create table if not exists brand_profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  niche       text not null default '',
  voice       jsonb not null default '{}'::jsonb,
  platforms   platform[] not null default '{instagram,youtube}',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trends -> strategies -> content -> media -> publications -> analytics
-- ---------------------------------------------------------------------------
create table if not exists trends (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid references brand_profiles(id) on delete cascade,
  source            text not null,
  topic             text not null,
  raw               jsonb not null default '{}'::jsonb,
  viral_score       int not null default 0,
  opportunity_score int not null default 0,
  embedding         vector(768),
  created_at        timestamptz not null default now()
);
create index if not exists trends_brand_idx on trends(brand_id, created_at desc);

create table if not exists strategies (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references brand_profiles(id) on delete cascade,
  trend_id        uuid references trends(id) on delete set null,
  angle           text not null,
  hooks           jsonb not null default '[]'::jsonb,
  hashtags        jsonb not null default '[]'::jsonb,
  target_platform platform not null,
  status          text not null default 'proposed',
  created_at      timestamptz not null default now()
);

create table if not exists content_items (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid references brand_profiles(id) on delete cascade,
  strategy_id    uuid references strategies(id) on delete set null,
  platform       platform not null,
  type           content_type not null,
  body           text not null default '',
  metadata       jsonb not null default '{}'::jsonb,
  quality_scores jsonb,
  status         content_status not null default 'draft',
  embedding      vector(768),
  created_at     timestamptz not null default now()
);
create index if not exists content_status_idx on content_items(status, created_at desc);

create table if not exists media_assets (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid references content_items(id) on delete cascade,
  kind            text not null default 'image',
  r2_key          text not null,
  prompt          text not null default '',
  style           text,
  created_at      timestamptz not null default now()
);

create table if not exists publications (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid references content_items(id) on delete cascade,
  platform        platform not null,
  external_id     text,
  scheduled_for   timestamptz,
  published_at    timestamptz,
  status          publication_status not null default 'queued',
  error           text,
  retries         int not null default 0
);
create index if not exists publications_sched_idx on publications(status, scheduled_for);

create table if not exists analytics (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid references publications(id) on delete cascade,
  platform        platform not null,
  metrics         jsonb not null default '{}'::jsonb,
  fetched_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cost control
-- ---------------------------------------------------------------------------
create table if not exists ai_usage (
  id            uuid primary key default gen_random_uuid(),
  agent         text not null,
  workflow      text,
  platform      platform,
  model_tier    model_tier not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cost_estimate numeric(10,5) not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_time_idx on ai_usage(created_at desc);

create table if not exists budgets (
  id            uuid primary key default gen_random_uuid(),
  scope         budget_scope not null,
  scope_ref     text,
  daily_limit   numeric(10,2) not null,
  monthly_limit numeric(10,2) not null,
  unique (scope, scope_ref)
);

-- ---------------------------------------------------------------------------
-- Prompts / cache / commands / audit
-- ---------------------------------------------------------------------------
create table if not exists prompt_templates (
  id         uuid primary key default gen_random_uuid(),
  key        text not null,
  version    int not null default 1,
  body       text not null,
  created_at timestamptz not null default now(),
  unique (key, version)
);

create table if not exists cache_entries (
  key        text primary key,
  task_type  text not null,
  payload    jsonb not null,
  expires_at timestamptz
);

create table if not exists commands (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  raw           text not null,
  parsed_intent jsonb,
  status        text not null default 'received',
  created_at    timestamptz not null default now()
);

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text not null,
  action     text not null,
  entity     text,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
