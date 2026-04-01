create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  brand_name text,
  legal_name text,
  industry text not null default 'general',
  primary_color text not null default '#22d3ee',
  accent_color text not null default '#8b5cf6',
  logo_url text,
  support_email text,
  support_phone text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  provider text not null default 'meta',
  status text not null default 'draft',
  phone_number_id text,
  from_number text,
  access_token text,
  business_account_id text,
  verify_token text,
  app_secret text,
  twilio_account_sid text,
  twilio_auth_token text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_workflows
  add column if not exists channel_type text not null default 'email',
  add column if not exists target_phone text,
  add column if not exists use_ai boolean not null default true;

create index if not exists company_settings_industry_idx on public.company_settings(industry);
create index if not exists whatsapp_channels_company_idx on public.whatsapp_channels(company_id);
create index if not exists automation_workflows_channel_idx on public.automation_workflows(channel_type, status);

alter table public.company_settings enable row level security;
alter table public.whatsapp_channels enable row level security;

create policy "company settings member read"
on public.company_settings for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "whatsapp channels member read"
on public.whatsapp_channels for select
using ((select public.is_platform_admin()) or public.is_company_member(company_id));

create policy "company settings admin write"
on public.company_settings for all
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "whatsapp channels admin write"
on public.whatsapp_channels for all
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at before update on public.company_settings
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_whatsapp_channels_updated_at on public.whatsapp_channels;
create trigger set_whatsapp_channels_updated_at before update on public.whatsapp_channels
for each row execute procedure public.touch_updated_at();
