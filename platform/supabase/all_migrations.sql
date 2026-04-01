-- ============================================
-- MIGRATION: 001_init.sql
-- ============================================

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  company text,
  whatsapp text,
  goal text not null,
  source text not null default 'landing',
  affiliate_code text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_affiliate_code_idx on public.leads (affiliate_code);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists lead_events_status_scheduled_idx on public.lead_events (status, scheduled_for);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  affiliate_code text not null unique,
  commission_rate numeric(5,2) not null default 0.30,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null references public.affiliates(affiliate_code) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  referral_status text not null default 'captured',
  commission_amount numeric(10,2),
  created_at timestamptz not null default now(),
  unique (affiliate_code, lead_id)
);

create index if not exists affiliate_referrals_code_idx on public.affiliate_referrals (affiliate_code);

alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;

-- Starter policies: deny client-side direct access by default.
create policy "No direct lead access"
on public.leads for all
using (false)
with check (false);

create policy "No direct event access"
on public.lead_events for all
using (false)
with check (false);

create policy "No direct affiliate access"
on public.affiliates for all
using (false)
with check (false);

create policy "No direct referral access"
on public.affiliate_referrals for all
using (false)
with check (false);


-- ============================================
-- MIGRATION: 002_commerce_and_auth.sql
-- ============================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_checkout_id text not null unique,
  customer_email text not null,
  plan_id text not null,
  billing_cycle text not null default 'monthly',
  amount numeric(10,2) not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending',
  lead_id uuid references public.leads(id) on delete set null,
  affiliate_code text references public.affiliates(affiliate_code) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_affiliate_code_idx on public.orders(affiliate_code);

alter table public.orders enable row level security;

create policy "No direct order access"
on public.orders for all
using (false)
with check (false);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();


-- ============================================
-- MIGRATION: 003_multitenant_ai.sql
-- ============================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  plan text not null default 'starter',
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  model text not null default 'gpt-4.1-mini',
  system_prompt text not null,
  temperature numeric(3,2) not null default 0.3,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  input_text text not null,
  output_text text,
  model text,
  status text not null default 'queued',
  usage_input_tokens integer,
  usage_output_tokens integer,
  provider_response_id text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'daily_digest',
  target_email text,
  prompt_template text not null,
  status text not null default 'active',
  schedule_cron text not null default '0 12 * * *',
  last_run_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.automation_workflows(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'queued',
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);


alter table public.leads add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.orders add column if not exists company_id uuid references public.companies(id) on delete set null;
create index if not exists leads_company_idx on public.leads(company_id);
create index if not exists orders_company_idx on public.orders(company_id);

create index if not exists companies_slug_idx on public.companies(slug);
create index if not exists memberships_user_idx on public.company_memberships(user_id);
create index if not exists ai_agents_company_idx on public.ai_agents(company_id);
create index if not exists ai_runs_company_idx on public.ai_runs(company_id, created_at desc);
create index if not exists workflows_company_idx on public.automation_workflows(company_id);
create index if not exists automation_logs_company_idx on public.automation_logs(company_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.ai_agents enable row level security;
alter table public.ai_runs enable row level security;
alter table public.automation_workflows enable row level security;
alter table public.automation_logs enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_company_member(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships cm
    where cm.company_id = _company_id and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform_admin'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_ai_agents_updated_at on public.ai_agents;
create trigger set_ai_agents_updated_at before update on public.ai_agents
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_workflows_updated_at on public.automation_workflows;
create trigger set_workflows_updated_at before update on public.automation_workflows
for each row execute procedure public.touch_updated_at();

create policy "profiles self read"
on public.profiles for select
using (id = auth.uid() or (select public.is_platform_admin()));

create policy "profiles self update"
on public.profiles for update
using (id = auth.uid() or (select public.is_platform_admin()))
with check (id = auth.uid() or (select public.is_platform_admin()));

create policy "companies member read"
on public.companies for select
using ((select public.is_platform_admin()) or public.is_company_member(id));

create policy "memberships member read"
on public.company_memberships for select
using ((select public.is_platform_admin()) or user_id = auth.uid() or public.is_company_member(company_id));

create policy "agents member read"
on public.ai_agents for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "runs member read"
on public.ai_runs for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "workflows member read"
on public.automation_workflows for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "automation logs member read"
on public.automation_logs for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));


-- ============================================
-- MIGRATION: 004_branding_whatsapp_multichannel.sql
-- ============================================

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  brand_name text,
  legal_name text,
  industry text not null default 'general',
  primary_color text not null default '#22d3ee',
  accent_color text not null default '#8b5cf6',
  logo_url text,
  support_email text,
  support_phone text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  provider text not null default 'meta',
  status text not null default 'draft',
  phone_number_id text,
  from_number text,
  access_token text,
  business_account_id text,
  verify_token text,
  app_secret text,
  twilio_account_sid text,
  twilio_auth_token text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_workflows
  add column if not exists channel_type text not null default 'email',
  add column if not exists target_phone text,
  add column if not exists use_ai boolean not null default true;

create index if not exists company_settings_industry_idx on public.company_settings(industry);
create index if not exists whatsapp_channels_company_idx on public.whatsapp_channels(company_id);
create index if not exists automation_workflows_channel_idx on public.automation_workflows(channel_type, status);

alter table public.company_settings enable row level security;
alter table public.whatsapp_channels enable row level security;

create policy "company settings member read"
on public.company_settings for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "whatsapp channels member read"
on public.whatsapp_channels for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "company settings admin write"
on public.company_settings for all
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "whatsapp channels admin write"
on public.whatsapp_channels for all
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at before update on public.company_settings
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_whatsapp_channels_updated_at on public.whatsapp_channels;
create trigger set_whatsapp_channels_updated_at before update on public.whatsapp_channels
for each row execute procedure public.touch_updated_at();


-- ============================================
-- MIGRATION: 005_conversations_messages.sql
-- ============================================

-- 005_conversations_messages.sql
-- Adds the conversations and messages tables for the CRM module.
-- Tables like profiles, companies, company_memberships, ai_agents, whatsapp_channels
-- are already created by migrations 003 and 004.

-- Conversations aggregate thread for each contact per company
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_name text,
  contact_phone text,
  channel text not null default 'whatsapp',
  status text not null default 'open',
  assigned_user_id uuid references public.profiles(id) on delete set null,
  stage_id uuid,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_company on public.conversations(company_id);
create index if not exists idx_conversations_contact_phone on public.conversations(company_id, contact_phone);
create index if not exists idx_conversations_last_message on public.conversations(company_id, last_message_at desc nulls last);

-- Individual messages within a conversation
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  content text not null,
  raw_payload jsonb,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_messages_company on public.messages(company_id);

-- Legacy inbound/outbound tables (used by WhatsApp webhook route)
create table if not exists public.inbound_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel text not null,
  contact_handle text not null,
  content text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel text not null,
  contact_handle text not null,
  content text not null,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_inbound_messages_company on public.inbound_messages(company_id, created_at desc);
create index if not exists idx_outbound_messages_company on public.outbound_messages(company_id, created_at desc);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.inbound_messages enable row level security;
alter table public.outbound_messages enable row level security;

-- Helper function: returns all company_ids the current user belongs to
create or replace function public.current_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.company_id
  from public.company_memberships cm
  where cm.user_id = auth.uid()
$$;

-- Conversations policies
create policy "members can read conversations"
on public.conversations for select
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can insert conversations"
on public.conversations for insert
with check (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can update conversations"
on public.conversations for update
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()))
with check (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

-- Messages policies
create policy "members can read messages"
on public.messages for select
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "members can insert messages"
on public.messages for insert
with check (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

-- Inbound/outbound (service role only, no client access by default)
create policy "inbound messages company scoped"
on public.inbound_messages for select
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

create policy "outbound messages company scoped"
on public.outbound_messages for select
using (company_id in (select public.current_company_ids()) or (select public.is_platform_admin()));

-- Conversations trigger
drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute procedure public.touch_updated_at();

-- Enable realtime for live CRM
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;


-- ============================================
-- MIGRATION: 007_crm_pipeline.sql
-- ============================================

create extension if not exists pgcrypto;

alter table if exists public.conversations
  add column if not exists assigned_user_id uuid,
  add column if not exists stage_id uuid;

create table if not exists public.crm_tags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.conversation_tags (
  company_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag_id uuid not null references public.crm_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, tag_id)
);

create table if not exists public.conversation_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_user_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.sales_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  pipeline_id uuid not null references public.sales_pipelines(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_closed_won boolean not null default false,
  is_closed_lost boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  title text not null,
  amount numeric(12,2),
  currency text default 'USD',
  stage_id uuid references public.sales_stages(id) on delete set null,
  owner_user_id uuid,
  expected_close_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(conversation_id)
);

create index if not exists idx_conversations_company_assigned on public.conversations(company_id, assigned_user_id);
create index if not exists idx_conversations_company_stage on public.conversations(company_id, stage_id);
create index if not exists idx_conversation_notes_company_conversation on public.conversation_notes(company_id, conversation_id, created_at desc);
create index if not exists idx_crm_opportunities_company_stage on public.crm_opportunities(company_id, stage_id);

insert into public.sales_pipelines (company_id, name)
select c.id, 'Pipeline principal'
from public.companies c
where not exists (
  select 1 from public.sales_pipelines p where p.company_id = c.id
);

insert into public.sales_stages (company_id, pipeline_id, name, sort_order, is_closed_won, is_closed_lost)
select p.company_id, p.id, s.name, s.sort_order, s.is_closed_won, s.is_closed_lost
from public.sales_pipelines p
cross join (
  values
    ('Nuevo lead', 1, false, false),
    ('Calificado', 2, false, false),
    ('Propuesta enviada', 3, false, false),
    ('Negociación', 4, false, false),
    ('Ganado', 5, true, false),
    ('Perdido', 6, false, true)
) as s(name, sort_order, is_closed_won, is_closed_lost)
where not exists (
  select 1 from public.sales_stages st where st.pipeline_id = p.id
);

create or replace function public.crm_company_operators(p_company_id uuid)
returns table(user_id uuid, role text, full_name text, email text)
language sql
security definer
set search_path = public
as $$
  select cm.user_id, cm.role, coalesce(pr.full_name, ''), pr.email
  from public.company_memberships cm
  left join public.profiles pr on pr.id = cm.user_id
  where cm.company_id = p_company_id
  order by pr.full_name nulls last, pr.email nulls last;
$$;

alter table public.crm_tags enable row level security;
alter table public.conversation_tags enable row level security;
alter table public.conversation_notes enable row level security;
alter table public.sales_pipelines enable row level security;
alter table public.sales_stages enable row level security;
alter table public.crm_opportunities enable row level security;

create policy if not exists "members can read crm_tags"
on public.crm_tags for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can insert crm_tags"
on public.crm_tags for insert
with check (company_id in (select public.current_company_ids()));

create policy if not exists "members can read conversation_tags"
on public.conversation_tags for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can manage conversation_tags"
on public.conversation_tags for all
using (company_id in (select public.current_company_ids()))
with check (company_id in (select public.current_company_ids()));

create policy if not exists "members can read conversation_notes"
on public.conversation_notes for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can insert conversation_notes"
on public.conversation_notes for insert
with check (company_id in (select public.current_company_ids()));

create policy if not exists "members can read sales_pipelines"
on public.sales_pipelines for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can read sales_stages"
on public.sales_stages for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can read crm_opportunities"
on public.crm_opportunities for select
using (company_id in (select public.current_company_ids()));

create policy if not exists "members can manage crm_opportunities"
on public.crm_opportunities for all
using (company_id in (select public.current_company_ids()))
with check (company_id in (select public.current_company_ids()));

alter publication supabase_realtime add table public.conversation_notes;
alter publication supabase_realtime add table public.crm_opportunities;


-- ============================================
-- MIGRATION: 008_agentgrid_engine.sql
-- ============================================

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



