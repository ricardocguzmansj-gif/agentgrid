import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateReply } from '@/lib/openai'
import { sendWhatsAppText } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('x-cron-secret')
  if (auth !== process.env.CLOUDFLARE_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*, company:companies(*), channel:whatsapp_channels(*)')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const results = []

  for (const wf of workflows ?? []) {
    try {
      const text = await generateReply({
        system: `You are an automation assistant for ${wf.company.name}.`,
        user: wf.prompt_template
      })

      if (wf.channel_type === 'whatsapp' && wf.channel?.meta_phone_number_id && wf.channel?.meta_access_token && wf.target_contact) {
        const providerResponse = await sendWhatsAppText({
          phoneNumberId: wf.channel.meta_phone_number_id,
          accessToken: wf.channel.meta_access_token,
          to: wf.target_contact,
          body: text
        })

        await supabase.from('automation_logs').insert({
          workflow_id: wf.id,
          company_id: wf.company_id,
          status: 'sent',
          output_text: text,
          provider_response: providerResponse
        })
      } else {
        await supabase.from('automation_logs').insert({
          workflow_id: wf.id,
          company_id: wf.company_id,
          status: 'skipped',
          output_text: text,
          provider_response: { reason: 'Missing channel or target_contact' }
        })
      }

      results.push({ workflow: wf.name, status: 'ok' })
    } catch (e) {
      await supabase.from('automation_logs').insert({
        workflow_id: wf.id,
        company_id: wf.company_id,
        status: 'error',
        output_text: null,
        provider_response: { error: e instanceof Error ? e.message : 'Unknown error' }
      })
      results.push({ workflow: wf.name, status: 'error' })
    }
  }

  return NextResponse.json({ ok: true, results })
}
