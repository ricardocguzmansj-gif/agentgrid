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
