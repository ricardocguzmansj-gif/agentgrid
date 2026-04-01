create table if not exists public.reporting_snapshots (
  id bigserial primary key,
  company_id uuid not null,
  snapshot_type text not null default 'executive',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists reporting_snapshots_company_idx
  on public.reporting_snapshots(company_id, created_at desc);
