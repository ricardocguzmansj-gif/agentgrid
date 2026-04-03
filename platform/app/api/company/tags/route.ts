import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { getCurrentCompanyId } from '@/lib/company'


export async function GET() {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from('crm_tags').select('*').eq('company_id', companyId).order('name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tags: data ?? [] })
}

export async function POST(req: NextRequest) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const body = await req.json()
  const name = String(body?.name || '').trim()
  const color = body?.color ? String(body.color) : '#10b981'
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('crm_tags')
    .insert({ company_id: companyId, name, color })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tag: data })
}
