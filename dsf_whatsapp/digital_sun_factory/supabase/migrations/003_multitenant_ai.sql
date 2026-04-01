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
