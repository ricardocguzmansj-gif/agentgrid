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
    const stage = String(body?.stage || '').trim()
    if (!stage || !(stage in STAGE_PROBABILITIES)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    const companyId = await getCurrentCompanyIdOrThrow()
    const supabase = adminSupabase()

    const { data: existing, error: existingError } = await supabase
      .from('opportunities')
      .select('id,company_id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }
    if (existing.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload: Record<string, any> = {
      stage,
      probability: STAGE_PROBABILITIES[stage],
      updated_at: new Date().toISOString(),
    }
    if (stage === 'won' || stage === 'lost') {
      payload.closed_at = new Date().toISOString()
    }

    const { error } = await supabase.from('opportunities').update(payload).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}
