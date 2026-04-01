import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getCurrentUserProfile, userCanAccessCompany } from '@/lib/tenant';

export const runtime = 'edge';

const schema = z.object({
  companyId: z.string().uuid(),
  provider: z.enum(['meta', 'twilio']).default('meta'),
  phoneNumberId: z.string().optional().or(z.literal('')),
  accessToken: z.string().optional().or(z.literal('')),
  fromNumber: z.string().optional().or(z.literal('')),
  twilioAccountSid: z.string().optional().or(z.literal('')),
  twilioAuthToken: z.string().optional().or(z.literal('')),
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
    const { data, error } = await supabase
      .from('whatsapp_channels')
      .upsert({
        company_id: payload.companyId,
        provider: payload.provider,
        status: 'active',
        phone_number_id: payload.phoneNumberId || null,
        access_token: payload.accessToken || null,
        from_number: payload.fromNumber || null,
        twilio_account_sid: payload.twilioAccountSid || null,
        twilio_auth_token: payload.twilioAuthToken || null,
        created_by: profile.id,
      }, { onConflict: 'company_id' })
      .select('id, provider, status')
      .single();

    if (error || !data) throw error ?? new Error('No se pudo guardar el canal de WhatsApp.');
    return NextResponse.json({ ok: true, channel: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo guardar el canal.' }, { status: 400 });
  }
}
