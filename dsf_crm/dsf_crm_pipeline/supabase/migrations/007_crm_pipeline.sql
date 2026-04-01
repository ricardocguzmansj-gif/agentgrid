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
