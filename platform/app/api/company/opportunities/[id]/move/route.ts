import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentCompanyIdOrThrow } from '@/lib/company'


const STAGE_PROBABILITIES: Record<string, number> = {
  new: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
}

function adminSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const stageKey = String(body?.stage || '').toLowerCase().trim()
    
    if (!stageKey || !(stageKey in STAGE_PROBABILITIES)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    const companyId = await getCurrentCompanyIdOrThrow()
    const supabase = adminSupabase()

    // 1. Verify existence and company
    const { data: existing, error: existingError } = await supabase
      .from('crm_opportunities')
      .select('id,company_id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }
    if (existing.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Resolve stage_id from stageKey
    const REVERSE_STAGE_MAP: Record<string, string[]> = {
      new: ['nuevo lead', 'nuevo'],
      qualified: ['calificado'],
      proposal: ['propuesta enviada', 'propuesta'],
      negotiation: ['negociación'],
      won: ['ganado'],
      lost: ['perdido'],
    };

    const targetNames = REVERSE_STAGE_MAP[stageKey] || [stageKey]
    
    let { data: targetStage, error: stageError } = await supabase
      .from('sales_stages')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', `%${targetNames[0]}%`)
      .limit(1)
      .maybeSingle()

    if (stageError || !targetStage) {
      // Fallback: try exact matches for all aliases
      const { data: fallbackStage } = await supabase
        .from('sales_stages')
        .select('id')
        .eq('company_id', companyId)
        .in('name', targetNames.map(n => n.charAt(0).toUpperCase() + n.slice(1))) // Capitalize first letter
        .limit(1)
        .maybeSingle()
      
      if (!fallbackStage) {
        return NextResponse.json({ error: `No se encontró la etapa de destino para "${stageKey}"` }, { status: 400 })
      }
      targetStage = fallbackStage
    }

    const payload: Record<string, any> = {
      stage_id: targetStage!.id,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('crm_opportunities').update(payload).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Move Opportunity API Error]', error)
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}
