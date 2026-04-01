import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCurrentCompanyId } from '@/lib/company'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const { id } = await context.params
  const body = await req.json()
  const noteBody = String(body?.body || '').trim()
  const authorUserId = body?.author_user_id || null

  if (!noteBody) return NextResponse.json({ error: 'body_required' }, { status: 400 })

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('conversation_notes')
    .insert({ company_id: companyId, conversation_id: id, body: noteBody, author_user_id: authorUserId })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}
