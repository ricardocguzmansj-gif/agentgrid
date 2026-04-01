import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/auth';
import { getAgentTemplates } from '@/lib/agent-templates';

export const runtime = 'edge';

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['starter', 'pro', 'scale', 'enterprise']).default('starter'),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  industry: z.enum(['general', 'ecommerce', 'clinica', 'inmobiliaria', 'educacion']).default('general'),
  brandName: z.string().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#22d3ee'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#8b5cf6'),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const authClient = await getSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }
    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdminClient();

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', user.email).single();

    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: payload.name,
        slug: payload.slug,
        plan: payload.plan,
        created_by: profile?.id || null,
      })
      .select('id, name, slug, plan, status')
      .single();

    if (error || !company) throw error ?? new Error('No se pudo crear la empresa');

    await supabase.from('company_settings').upsert({
      company_id: company.id,
      brand_name: payload.brandName || payload.name,
      industry: payload.industry,
      primary_color: payload.primaryColor,
      accent_color: payload.accentColor,
      support_email: payload.supportEmail || null,
      support_phone: payload.supportPhone || null,
    });

    if (payload.ownerEmail) {
      const { data: ownerProfile } = await supabase.from('profiles').select('id').eq('email', payload.ownerEmail).maybeSingle();
      if (ownerProfile?.id) {
        await supabase.from('company_memberships').insert({ company_id: company.id, user_id: ownerProfile.id, role: 'owner' });
      }
    }

    const templates = getAgentTemplates(payload.industry, payload.brandName || payload.name).map((template) => ({
      company_id: company.id,
      name: template.name,
      model: template.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      system_prompt: template.systemPrompt,
      temperature: template.temperature ?? 0.3,
      created_by: profile?.id || null,
    }));

    await supabase.from('ai_agents').insert(templates);

    return NextResponse.json({ ok: true, company });
  } catch (error) {
    console.error('[Admin Companies API Error]', error);
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Validación fallida (${issues})` }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : (error as any)?.message || 'No se pudo crear la empresa.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
