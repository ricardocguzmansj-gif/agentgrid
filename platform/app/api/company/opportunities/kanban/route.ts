import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { getCurrentCompanyIdOrThrow } from '@/lib/company'

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow()
    const supabase = getSupabaseAdminClient()

    // 1. Get opportunities from crm_opportunities
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*, stage:sales_stages(name), conversation:conversations(contact_name)')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // 2. Map stages to keys expected by the frontend
    const STAGE_MAP: Record<string, string> = {
      'nuevo lead': 'new',
      'calificado': 'qualified',
      'propuesta enviada': 'proposal',
      'negociación': 'negotiation',
      'ganado': 'won',
      'perdido': 'lost',
    };

    const ownerIds = Array.from(new Set((data || []).map((row: any) => row.owner_user_id).filter(Boolean)))
    let profilesById: Record<string, string> = {}

    if (ownerIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,full_name,email')
        .in('id', ownerIds)
      profilesById = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name || p.email || 'Operador']))
    }

    const items = (data || []).map((row: any) => {
      const dbStageName = row.stage?.name?.toLowerCase() || ''
      const mappedStage = STAGE_MAP[dbStageName] || 'new'
      
      return {
        id: row.id,
        title: row.title,
        amount: Number(row.amount || 0),
        stage: mappedStage,
        probability: row.probability || 0,
        expected_close_date: row.expected_close_at,
        owner_user_id: row.owner_user_id,
        contact_name: row.conversation?.contact_name || 'Sin contacto',
        company_name: null, // Not directly available in crm_opportunities, could be contact company
        owner_name: row.owner_user_id ? profilesById[row.owner_user_id] || 'Operador' : null,
        updated_at: row.updated_at,
      }
    })

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('[Kanban API Error]', error)
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}
