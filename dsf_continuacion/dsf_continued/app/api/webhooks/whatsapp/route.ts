import { NextRequest, NextResponse } from 'next/server'
import { extractInboundMessages, sendWhatsAppText } from '@/lib/whatsapp'
import { getCompanyByPhoneNumberId, getDefaultAgentForCompany } from '@/lib/tenant'
import { generateReply } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const payload = await request.json()
  const messages = extractInboundMessages(payload)
  const supabase = getSupabaseAdmin()
  const results: Array<{ from: string; status: string; detail?: string }> = []

  for (const msg of messages) {
    try {
      const company = await getCompanyByPhoneNumberId(msg.phoneNumberId)
      if (!company) {
        results.push({ from: msg.from, status: 'ignored', detail: 'No tenant mapped to phone_number_id' })
        continue
      }

      const { data: channel } = await supabase
        .from('whatsapp_channels')
        .select('*')
        .eq('company_id', company.id)
        .eq('meta_phone_number_id', msg.phoneNumberId)
        .maybeSingle()

      const agent = await getDefaultAgentForCompany(company.id)
      if (!channel || !agent) {
        results.push({ from: msg.from, status: 'ignored', detail: 'Missing active channel or agent' })
        continue
      }

      await supabase.from('inbound_messages').insert({
        company_id: company.id,
        channel: 'whatsapp',
        contact_handle: msg.from,
        content: msg.text,
        raw_payload: msg.raw
      })

      const answer = await generateReply({
        system: agent.system_prompt,
        user: msg.text
      })

      const providerResponse = await sendWhatsAppText({
        phoneNumberId: channel.meta_phone_number_id,
        accessToken: channel.meta_access_token,
        to: msg.from,
        body: answer
      })

      await supabase.from('outbound_messages').insert({
        company_id: company.id,
        channel: 'whatsapp',
        contact_handle: msg.from,
        content: answer,
        provider_response: providerResponse
      })

      results.push({ from: msg.from, status: 'replied' })
    } catch (error) {
      results.push({ from: msg.from, status: 'error', detail: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
