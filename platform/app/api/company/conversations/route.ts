import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getCurrentCompanyId } from '@/lib/company'

export async function GET(req: NextRequest) {
  const companyId = await getCurrentCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: 'company_not_selected' }, { status: 400 })
  }

  const conversationId = req.nextUrl.searchParams.get('conversationId')
  const supabase = getSupabaseServer()

  if (conversationId) {
    const [{ data: messages, error: messagesError }, { data: notes, error: notesError }, { data: tags, error: tagsError }, { data: opportunity, error: oppError }] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      supabase
        .from('conversation_notes')
        .select('*')
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('conversation_tags')
        .select('tag:crm_tags(*)')
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId),
      supabase
        .from('crm_opportunities')
        .select('*')
        .eq('company_id', companyId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (messagesError || notesError || tagsError || oppError) {
      return NextResponse.json({ error: messagesError?.message || notesError?.message || tagsError?.message || oppError?.message }, { status: 500 })
    }

    return NextResponse.json({
      messages: messages ?? [],
      notes: notes ?? [],
      tags: (tags ?? []).map((item: { tag: unknown }) => item.tag),
      opportunity: opportunity ?? null,
    })
  }

  const [{ data: conversations, error: conversationsError }, { data: operators, error: operatorsError }, { data: tags, error: tagsError }, { data: stages, error: stagesError }] = await Promise.all([
    supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase.rpc('crm_company_operators', { p_company_id: companyId }),
    supabase.from('crm_tags').select('*').eq('company_id', companyId).order('name', { ascending: true }),
    supabase.from('sales_stages').select('*').eq('company_id', companyId).order('sort_order', { ascending: true }),
  ])

  if (conversationsError || operatorsError || tagsError || stagesError) {
    return NextResponse.json({ error: conversationsError?.message || operatorsError?.message || tagsError?.message || stagesError?.message }, { status: 500 })
  }

  return NextResponse.json({
    conversations: conversations ?? [],
    operators: operators ?? [],
    tags: tags ?? [],
    stages: stages ?? [],
  })
}
