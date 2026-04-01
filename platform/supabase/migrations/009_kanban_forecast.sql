-- Módulo Kanban + Forecast

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  contact_name text,
  company_name text,
  amount numeric(12,2) not null default 0,
  stage text not null default 'new',
  probability integer not null default 10,
  expected_close_date date,
  closed_at timestamptz,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opportunities_company_stage on public.opportunities(company_id, stage);
create index if not exists idx_opportunities_company_owner on public.opportunities(company_id, owner_user_id);
create index if not exists idx_opportunities_expected_close_date on public.opportunities(expected_close_date);

create or replace function public.set_opportunity_probability()
returns trigger
language plpgsql
as $$
begin
  if NEW.stage = 'new' then NEW.probability := 10;
  elsif NEW.stage = 'qualified' then NEW.probability := 25;
  elsif NEW.stage = 'proposal' then NEW.probability := 50;
  elsif NEW.stage = 'negotiation' then NEW.probability := 75;
  elsif NEW.stage = 'won' then NEW.probability := 100;
  elsif NEW.stage = 'lost' then NEW.probability := 0;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_set_opportunity_probability on public.opportunities;
create trigger trg_set_opportunity_probability
before insert or update of stage on public.opportunities
for each row
execute function public.set_opportunity_probability();

alter table public.opportunities enable row level security;

-- Ajustá esta policy si ya tenés una política general para company_memberships
drop policy if exists opportunities_select_by_membership on public.opportunities;
create policy opportunities_select_by_membership on public.opportunities
for select
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = opportunities.company_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists opportunities_insert_by_membership on public.opportunities;
create policy opportunities_insert_by_membership on public.opportunities
for insert
with check (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = opportunities.company_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists opportunities_update_by_membership on public.opportunities;
create policy opportunities_update_by_membership on public.opportunities
for update
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = opportunities.company_id
      and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = opportunities.company_id
      and cm.user_id = auth.uid()
  )
);
