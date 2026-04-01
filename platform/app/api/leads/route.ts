import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildLeadFollowupEmail, sendEmail } from '@/lib/mailer';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { verifyTurnstile } from '@/lib/turnstile';

export const runtime = 'edge';

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  goal: z.string().min(10),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const remoteIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
    const verification = await verifyTurnstile(payload.turnstileToken, remoteIp);

    if (!verification.success) {
      return NextResponse.json({ error: 'Validación anti-bot fallida.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const affiliateCode = request.cookies.get('ds_ref')?.value ?? null;

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        company: payload.company,
        whatsapp: payload.whatsapp,
        goal: payload.goal,
        source: 'landing',
        affiliate_code: affiliateCode,
        status: 'new',
      })
      .select('id, first_name, email')
      .single();

    if (error || !lead) {
      throw error ?? new Error('No se pudo crear el lead');
    }

    const followups = [0, 1, 3, 5].map((offset) => {
      const at = new Date();
      at.setDate(at.getDate() + offset);
      return {
        lead_id: lead.id,
        event_type: offset === 0 ? 'welcome_email' : 'followup_email',
        scheduled_for: at.toISOString(),
        payload: { dayOffset: offset },
        status: 'pending',
      };
    });

    const { error: eventError } = await supabase.from('lead_events').insert(followups);
    if (eventError) throw eventError;

    const email = buildLeadFollowupEmail(payload.firstName);
    await sendEmail(payload.email, email.subject, email.html);

    if (process.env.SALES_TO_EMAIL) {
      await sendEmail(
        process.env.SALES_TO_EMAIL,
        `Nuevo lead: ${payload.firstName} ${payload.lastName}`,
        `<p><strong>Empresa:</strong> ${payload.company || 'N/D'}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Objetivo:</strong> ${payload.goal}</p>`
      );
    }

    if (affiliateCode) {
      await supabase.from('affiliate_referrals').insert({
        affiliate_code: affiliateCode,
        lead_id: lead.id,
        referral_status: 'captured',
      });
    }

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo registrar el lead.' }, { status: 400 });
  }
}
