import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCurrentCompanyId } from '@/lib/company'

export const runtime = 'edge';

export async function GET() {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const supabase = getSupabaseServer()
  const { data, error } = await supabase.rpc('crm_company_operators', { p_company_id: companyId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ operators: data ?? [] })
}
