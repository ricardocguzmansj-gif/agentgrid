create table if not exists public.reporting_snapshots (
  id bigserial primary key,
  company_id uuid not null,
  snapshot_type text not null default 'executive',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists reporting_snapshots_company_idx
  on public.reporting_snapshots(company_id, created_at desc);

alter table public.reporting_snapshots enable row level security;

create policy "members can read reporting_snapshots"
on public.reporting_snapshots for select
using (company_id in (select public.current_company_ids()));

create policy "members can insert reporting_snapshots"
on public.reporting_snapshots for insert
with check (company_id in (select public.current_company_ids()));
