import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCurrentCompanyId } from '@/lib/company'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const { id } = await context.params
  const { tagId, action } = await req.json()
  if (!tagId || !action) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const supabase = getSupabaseServer()

  if (action === 'remove') {
    const { error } = await supabase
      .from('conversation_tags')
      .delete()
      .eq('company_id', companyId)
      .eq('conversation_id', id)
      .eq('tag_id', tagId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('conversation_tags')
    .upsert({ company_id: companyId, conversation_id: id, tag_id: tagId }, { onConflict: 'conversation_id,tag_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
