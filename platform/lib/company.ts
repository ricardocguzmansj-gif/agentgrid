import { cookies } from 'next/headers'
import { getSupabaseServerClient } from './supabase'

/**
 * Gets the current company ID from the user's session cookie.
 * The portal sets a `dsf_company_id` cookie when the user selects a company.
 * Falls back to the first company the authenticated user is a member of.
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  // 1. Check cookie
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('dsf_company_id')?.value
  if (fromCookie) return fromCookie

  // 2. Fallback: get from user's memberships
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('company_memberships')
    .select('company_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  return memberships?.[0]?.company_id ?? null
}

/**
 * Throws an error if no company context is found.
 */
export async function getCurrentCompanyIdOrThrow(): Promise<string> {
  const companyId = await getCurrentCompanyId()
  if (!companyId) throw new Error('Company context is required')
  return companyId
}
