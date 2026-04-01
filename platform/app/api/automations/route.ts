import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getCurrentUserProfile, userCanAccessCompany } from '@/lib/tenant';

export const runtime = 'edge';

const schema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  channelType: z.enum(['email', 'whatsapp']).default('email'),
  targetEmail: z.string().email().optional().or(z.literal('')),
  targetPhone: z.string().optional().or(z.literal('')),
  promptTemplate: z.string().min(10),
  scheduleCron: z.string().min(5).default('0 12 * * *'),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const profile = await getCurrentUserProfile();
    if (!profile) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    if (!(await userCanAccessCompany(payload.companyId))) {
      return NextResponse.json({ error: 'No autorizado para esa empresa.' }, { status: 403 });
    }
    if (payload.channelType === 'email' && !payload.targetEmail) {
      return NextResponse.json({ error: 'Indicá un email destino.' }, { status: 400 });
    }
    if (payload.channelType === 'whatsapp' && !payload.targetPhone) {
      return NextResponse.json({ error: 'Indicá un número destino de WhatsApp.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        company_id: payload.companyId,
        name: payload.name,
        target_email: payload.targetEmail || null,
        target_phone: payload.targetPhone || null,
        channel_type: payload.channelType,
        prompt_template: payload.promptTemplate,
        schedule_cron: payload.scheduleCron,
        created_by: profile.id,
      })
      .select('id, name, status, target_email, target_phone, channel_type, schedule_cron')
      .single();

    if (error || !data) throw error ?? new Error('No se pudo guardar la automatización');

    return NextResponse.json({ ok: true, workflow: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo crear la automatización.' }, { status: 400 });
  }
}
