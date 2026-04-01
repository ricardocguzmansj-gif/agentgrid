import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { generateAIResponse } from '@/lib/ai';
import { sendEmail } from '@/lib/mailer';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('id, company_id, name, target_email, target_phone, channel_type, prompt_template, companies:company_id(name)')
      .eq('status', 'active')
      .limit(20);

    let processed = 0;
    for (const workflow of workflows || []) {
      const companyId = (workflow as any).company_id;
      const companyName = (workflow as any).companies?.name || 'Empresa';
      const channelType = (workflow as any).channel_type || 'email';
      const today = new Date().toISOString();
      const [{ data: leads }, { data: orders }] = await Promise.all([
        supabase.from('leads').select('first_name, last_name, company, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('plan_id, amount, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
      ]);

      const input = [
        `Empresa: ${companyName}`,
        `Fecha: ${today}`,
        `Leads recientes: ${JSON.stringify(leads || [])}`,
        `Órdenes recientes: ${JSON.stringify(orders || [])}`,
        `Instrucción: ${(workflow as any).prompt_template}`,
      ].join('\n\n');

      const ai = await generateAIResponse({
        systemPrompt: 'Sos un asistente de revenue operations. Respondé en español con un resumen ejecutivo y 3 acciones recomendadas.',
        input,
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        temperature: 0.2,
      });

      let deliveryStatus = 'completed';
      try {
        if (channelType === 'whatsapp' && (workflow as any).target_phone) {
          const { data: channel } = await supabase
            .from('whatsapp_channels')
            .select('provider, phone_number_id, access_token, from_number, twilio_account_sid, twilio_auth_token, status')
            .eq('company_id', companyId)
            .maybeSingle();
          await sendWhatsAppMessage({
            to: (workflow as any).target_phone,
            body: ai.text,
            companyChannel: channel,
          });
        } else if ((workflow as any).target_email) {
          await sendEmail((workflow as any).target_email, `Digest IA · ${companyName}`, `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${ai.text}</pre>`);
        }
      } catch (deliveryError) {
        deliveryStatus = 'delivery_error';
        ai.text += `\n\n[Error de entrega: ${deliveryError instanceof Error ? deliveryError.message : 'desconocido'}]`;
      }

      await supabase.from('automation_logs').insert({
        workflow_id: (workflow as any).id,
        company_id: companyId,
        status: deliveryStatus,
        summary: ai.text,
        payload: { leadsCount: (leads || []).length, ordersCount: (orders || []).length, channelType },
        completed_at: new Date().toISOString(),
      });

      await supabase.from('automation_workflows').update({ last_run_at: new Date().toISOString() }).eq('id', (workflow as any).id);
      processed += 1;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudieron ejecutar las automatizaciones.' }, { status: 500 });
  }
}
