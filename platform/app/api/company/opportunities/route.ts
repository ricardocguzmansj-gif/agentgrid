import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { getCurrentCompanyId } from '@/lib/company'


export async function GET() {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('crm_opportunities')
    .select('*, stage:sales_stages(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunities: data ?? [] })
}

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const body = await req.json()
  const conversationId = String(body?.conversationId || '')
  const title = String(body?.title || '').trim()
  const amount = body?.amount == null || body.amount === '' ? null : Number(body.amount)

  if (!conversationId || !title) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { data: firstStage } = await supabase
    .from('sales_stages')
    .select('id')
    .eq('company_id', companyId)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('crm_opportunities')
    .upsert({
      company_id: companyId,
      conversation_id: conversationId,
      title,
      amount,
      currency: 'USD',
      stage_id: firstStage?.id ?? null,
    }, { onConflict: 'conversation_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunity: data })
}
