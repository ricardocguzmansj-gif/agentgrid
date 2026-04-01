import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';

export async function getCurrentUserProfile() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getUserCompanies() {
  const profile = await getCurrentUserProfile();
  if (!profile) return [];
  const admin = getSupabaseAdminClient();

  if (profile.role === 'platform_admin') {
    const { data } = await admin
      .from('companies')
      .select('id, name, slug, plan, status, created_at, company_settings(brand_name, industry, primary_color, accent_color)')
      .order('created_at', { ascending: false });
    return (data || []).map((row: any) => ({ ...row, settings: Array.isArray(row.company_settings) ? row.company_settings[0] : row.company_settings }));
  }

  const { data } = await admin
    .from('company_memberships')
    .select('role, companies:company_id(id, name, slug, plan, status, created_at, company_settings(brand_name, industry, primary_color, accent_color))')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return (data || []).map((row: any) => ({
    ...row.companies,
    membership_role: row.role,
    settings: Array.isArray(row.companies?.company_settings) ? row.companies.company_settings[0] : row.companies?.company_settings,
  }));
}

export async function userCanAccessCompany(companyId: string) {
  const profile = await getCurrentUserProfile();
  if (!profile) return false;
  if (profile.role === 'platform_admin') return true;

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from('company_memberships')
    .select('id')
    .eq('company_id', companyId)
    .eq('user_id', profile.id)
    .maybeSingle();

  return !!data;
}

export async function getCompanyBranding(companyId: string) {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from('company_settings')
    .select('brand_name, industry, primary_color, accent_color, logo_url, support_email, support_phone, website_url')
    .eq('company_id', companyId)
    .maybeSingle();
  return data;
}
