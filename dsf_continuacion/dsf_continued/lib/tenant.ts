import { getSupabaseAdmin } from './supabase'
import type { Company } from './types'

export async function getCompanyByPhoneNumberId(phoneNumberId: string): Promise<Company | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('whatsapp_channels')
    .select('company:companies(*)')
    .eq('meta_phone_number_id', phoneNumberId)
    .maybeSingle()

  return (data?.company as Company) || null
}

export async function getDefaultAgentForCompany(companyId: string) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  return data
}
