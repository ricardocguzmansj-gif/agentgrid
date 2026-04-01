import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { getCompanyByPhoneNumberId, getDefaultAgentForCompany } from '@/lib/tenant'
import { generateAIResponse } from '@/lib/ai'
import { sendWhatsAppMessage } from '@/lib/whatsapp'


type InboundMsg = {
  from: string
  text: string
  phoneNumberId: string
  raw: unknown
}

function extractInboundMessages(payload: Record<string, unknown>): InboundMsg[] {
  const messages: InboundMsg[] = []
  const entries = (payload?.entry as Array<Record<string, unknown>>) || []
  for (const entry of entries) {
    const changes = (entry?.changes as Array<Record<string, unknown>>) || []
    for (const change of changes) {
      const value = change?.value as Record<string, unknown> | undefined
      if (!value) continue
      const metadata = value.metadata as Record<string, unknown> | undefined
      const phoneNumberId = String(metadata?.phone_number_id || '')
      const msgs = (value.messages as Array<Record<string, unknown>>) || []
      for (const msg of msgs) {
        if (msg.type !== 'text') continue
        const textObj = msg.text as Record<string, unknown> | undefined
        messages.push({
          from: String(msg.from || ''),
          text: String(textObj?.body || ''),
          phoneNumberId,
          raw: msg,
        })
      }
    }
  }
  return messages
}

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
  const supabase = getSupabaseAdminClient()
  const results: Array<{ from: string; status: string; detail?: string }> = []

  for (const msg of messages) {
    try {
      const company = await getCompanyByPhoneNumberId(msg.phoneNumberId)
      if (!company) {
        results.push({ from: msg.from, status: 'ignored', detail: 'No tenant mapped to phone_number_id' })
        continue
      }

      const companyId = company.id as string

      const { data: channel } = await supabase
        .from('whatsapp_channels')
        .select('*')
        .eq('company_id', companyId)
        .eq('phone_number_id', msg.phoneNumberId)
        .maybeSingle()

      const agent = await getDefaultAgentForCompany(companyId)
      if (!channel || !agent) {
        results.push({ from: msg.from, status: 'ignored', detail: 'Missing active channel or agent' })
        continue
      }

      // Store inbound message
      await supabase.from('inbound_messages').insert({
        company_id: companyId,
        channel: 'whatsapp',
        contact_handle: msg.from,
        content: msg.text,
        raw_payload: msg.raw,
      })

      // Generate AI reply using the agent's config
      const aiResponse = await generateAIResponse({
        systemPrompt: agent.system_prompt,
        input: msg.text,
        model: agent.model,
        temperature: agent.temperature,
      })

      // Send WhatsApp reply
      const providerResponse = await sendWhatsAppMessage({
        to: msg.from,
        body: aiResponse.text,
        companyChannel: channel,
      })

      // Store outbound message
      await supabase.from('outbound_messages').insert({
        company_id: companyId,
        channel: 'whatsapp',
        contact_handle: msg.from,
        content: aiResponse.text,
        provider_response: providerResponse,
      })

      results.push({ from: msg.from, status: 'replied' })
    } catch (error) {
      results.push({
        from: msg.from,
        status: 'error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
