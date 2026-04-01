import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentCompanyIdOrThrow } from '@/lib/company'

export const runtime = 'edge';

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow()
    const supabase = adminSupabase()

    const { data, error } = await supabase
      .from('opportunities')
      .select('id,title,contact_name,company_name,amount,stage,probability,expected_close_date,owner_user_id,updated_at')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const ownerIds = Array.from(new Set((data || []).map((row: any) => row.owner_user_id).filter(Boolean)))
    let profilesById: Record<string, string> = {}

    if (ownerIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,full_name,email')
        .in('id', ownerIds)
      profilesById = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name || p.email || 'Operador']))
    }

    const items = (data || []).map((row: any) => ({
      ...row,
      owner_name: row.owner_user_id ? profilesById[row.owner_user_id] || 'Operador' : null,
    }))

    return NextResponse.json({ items })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}
