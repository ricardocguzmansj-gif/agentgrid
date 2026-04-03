import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { getCurrentCompanyId } from '@/lib/company'


export async function GET() {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.rpc('crm_company_operators', { p_company_id: companyId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ operators: data ?? [] })
}
