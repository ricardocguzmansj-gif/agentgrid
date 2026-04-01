create extension if not exists pgcrypto;

create table if not exists public.report_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  report_type text not null default 'executive_summary',
  timezone text not null default 'America/Argentina/San_Juan',
  send_hour smallint not null default 9 check (send_hour between 0 and 23),
  weekday smallint check (weekday between 0 and 6),
  day_of_month smallint check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  filters jsonb not null default '{}'::jsonb,
  last_sent_at timestamptz,
  next_run_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.report_subscriptions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null check (status in ('queued', 'sent', 'failed')),
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  payload jsonb,
  provider_response jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_report_subscriptions_company_id on public.report_subscriptions(company_id);
create index if not exists idx_report_subscriptions_next_run_at on public.report_subscriptions(next_run_at) where is_active = true;
create index if not exists idx_report_deliveries_company_id on public.report_deliveries(company_id);
create index if not exists idx_report_deliveries_subscription_id on public.report_deliveries(subscription_id);

create or replace function public.set_updated_at_report_subscriptions()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_report_subscriptions_updated_at on public.report_subscriptions;
create trigger trg_report_subscriptions_updated_at
before update on public.report_subscriptions
for each row execute function public.set_updated_at_report_subscriptions();

alter table public.report_subscriptions enable row level security;
alter table public.report_deliveries enable row level security;

-- Adaptá estas policies si ya tenés una función propia para current_company_id.
create policy if not exists report_subscriptions_select_same_company
on public.report_subscriptions
for select
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = report_subscriptions.company_id
      and cm.user_id = auth.uid()
  )
);

create policy if not exists report_subscriptions_insert_same_company
on public.report_subscriptions
for insert
with check (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = report_subscriptions.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
  )
);

create policy if not exists report_subscriptions_update_same_company
on public.report_subscriptions
for update
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = report_subscriptions.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = report_subscriptions.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner', 'admin')
  )
);

create policy if not exists report_deliveries_select_same_company
on public.report_deliveries
for select
using (
  exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = report_deliveries.company_id
      and cm.user_id = auth.uid()
  )
);
