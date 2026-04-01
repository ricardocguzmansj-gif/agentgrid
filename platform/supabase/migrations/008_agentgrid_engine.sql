-- 008_agentgrid_engine.sql
-- Engine tables for durable autonomous agent execution.
-- These map to the AgentGrid Python backend (FastAPI + Celery).
-- The engine connects to the same Supabase and uses these tables to store runs.

-- Durable agent runs with full lifecycle tracking
create table if not exists public.engine_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','paused','cancelled','finished','error')),
  steps_used int not null default 0,
  max_steps int not null default 20,
  spent_usd numeric(10,4) not null default 0,
  budget_usd numeric(10,4) not null default 0.50,
  elapsed_sec int not null default 0,
  remaining_sec int not null default 300,
  max_runtime_sec int not null default 300,
  input_json jsonb not null default '{}'::jsonb,
  state_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  final_reason text,
  started_at timestamptz,
  finished_at timestamptz,
  last_heartbeat timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Events log for each engine run step
create table if not exists public.engine_events (
  id bigserial primary key,
  run_id uuid not null references public.engine_runs(id) on delete cascade,
  event_type text not null,
  step_index int not null default 0,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Checkpoints for resumable runs
create table if not exists public.engine_checkpoints (
  id bigserial primary key,
  run_id uuid not null references public.engine_runs(id) on delete cascade,
  step_index int not null default 0,
  state_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_engine_runs_company on public.engine_runs(company_id);
create index if not exists idx_engine_runs_agent on public.engine_runs(agent_id);
create index if not exists idx_engine_runs_status on public.engine_runs(status);
create index if not exists idx_engine_events_run on public.engine_events(run_id, created_at);
create index if not exists idx_engine_checkpoints_run on public.engine_checkpoints(run_id, step_index);

-- RLS
alter table public.engine_runs enable row level security;
alter table public.engine_events enable row level security;
alter table public.engine_checkpoints enable row level security;

create policy "members can read engine_runs"
on public.engine_runs for select
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can insert engine_runs"
on public.engine_runs for insert
with check (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can update engine_runs"
on public.engine_runs for update
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()))
with check (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can read engine_events"
on public.engine_events for select
using (
  run_id in (
    select id from public.engine_runs
    where company_id in (select public.current_company_ids())
  ) or (select public.is_platform_admin())
);

create policy "members can read engine_checkpoints"
on public.engine_checkpoints for select
using (
  run_id in (
    select id from public.engine_runs
    where company_id in (select public.current_company_ids())
  ) or (select public.is_platform_admin())
);

-- Realtime for live monitoring
alter publication supabase_realtime add table public.engine_runs;
alter publication supabase_realtime add table public.engine_events;
