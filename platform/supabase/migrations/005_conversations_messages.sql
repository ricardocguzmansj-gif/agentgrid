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
