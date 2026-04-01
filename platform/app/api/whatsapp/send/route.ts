import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getCurrentUserProfile, userCanAccessCompany } from '@/lib/tenant';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const runtime = 'edge';

const schema = z.object({
  companyId: z.string().uuid(),
  to: z.string().min(8),
  body: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const profile = await getCurrentUserProfile();
    if (!profile) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    if (!(await userCanAccessCompany(payload.companyId))) {
      return NextResponse.json({ error: 'No autorizado para esa empresa.' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: channel } = await supabase
      .from('whatsapp_channels')
      .select('provider, phone_number_id, access_token, from_number, twilio_account_sid, twilio_auth_token, status')
      .eq('company_id', payload.companyId)
      .maybeSingle();

    const result = await sendWhatsAppMessage({
      to: payload.to,
      body: payload.body,
      companyChannel: channel,
    });

    return NextResponse.json({ ok: true, providerMessageId: result.id, provider: result.provider });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.' }, { status: 400 });
  }
}
