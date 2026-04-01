import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCurrentCompanyId } from '@/lib/company'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })

  const { id } = await context.params
  const body = await req.json()
  const patch: Record<string, string | null> = {}

  if ('assigned_user_id' in body) patch.assigned_user_id = body.assigned_user_id || null
  if ('stage_id' in body) patch.stage_id = body.stage_id || null
  if ('status' in body) patch.status = body.status || 'open'

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('conversations')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversation: data })
}
