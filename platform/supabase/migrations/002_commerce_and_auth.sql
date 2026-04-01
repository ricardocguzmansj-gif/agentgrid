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
