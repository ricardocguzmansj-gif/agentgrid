-- 005_inbound_whatsapp_and_multitenant.sql
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  email text unique not null,
  platform_role text not null default 'user' check (platform_role in ('user','platform_admin')),
  created_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text not null check (industry in ('general','ecommerce','clinic','real_estate','education')),
  brand_primary text,
  brand_secondary text,
  support_email text,
  created_at timestamptz not null default now()
);

create table if not exists company_memberships (
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists ai_agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  niche text not null check (niche in ('general','ecommerce','clinic','real_estate','education')),
  system_prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  meta_phone_number_id text not null unique,
  meta_access_token text not null,
  phone_display text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inbound_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  channel text not null,
  contact_handle text not null,
  content text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists outbound_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  channel text not null,
  contact_handle text not null,
  content text not null,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists automation_workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  channel_type text not null check (channel_type in ('email','whatsapp')),
  prompt_template text not null,
  cron_schedule text not null,
  target_contact text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists automation_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references automation_workflows(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  status text not null,
  output_text text,
  provider_response jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table companies enable row level security;
alter table company_memberships enable row level security;
alter table ai_agents enable row level security;
alter table whatsapp_channels enable row level security;
alter table inbound_messages enable row level security;
alter table outbound_messages enable row level security;
alter table automation_workflows enable row level security;
alter table automation_logs enable row level security;

create or replace function is_platform_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.platform_role = 'platform_admin'
  );
$$;

create or replace function is_company_member(target_company uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from company_memberships cm
    where cm.company_id = target_company and cm.user_id = auth.uid()
  );
$$;

create policy "platform admin full profiles" on profiles
for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full companies" on companies
for all using (is_platform_admin()) with check (is_platform_admin());

create policy "members see company" on companies
for select using (is_company_member(id));

create policy "platform admin memberships" on company_memberships
for all using (is_platform_admin()) with check (is_platform_admin());

create policy "memberships visible to own company" on company_memberships
for select using (is_company_member(company_id));

create policy "company scoped ai agents" on ai_agents
for all using (is_company_member(company_id)) with check (is_company_member(company_id));

create policy "company scoped whatsapp" on whatsapp_channels
for all using (is_company_member(company_id)) with check (is_company_member(company_id));

create policy "company scoped inbound" on inbound_messages
for select using (is_company_member(company_id));

create policy "company scoped outbound" on outbound_messages
for select using (is_company_member(company_id));

create policy "company scoped automations" on automation_workflows
for all using (is_company_member(company_id)) with check (is_company_member(company_id));

create policy "company scoped automation logs" on automation_logs
for select using (is_company_member(company_id));
