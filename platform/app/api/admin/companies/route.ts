import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/auth';
import { getAgentTemplates } from '@/lib/agent-templates';


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
    console.log('[Admin Companies] Starting company creation...');
    
    const authClient = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    console.log('[Admin Companies] Auth result:', { 
      email: user?.email || 'NO_USER', 
      authError: authError?.message || 'none' 
    });
    
    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ 
        error: `No autorizado. Email: ${user?.email || 'sin sesión'}. ¿Estás logueado?` 
      }, { status: 403 });
    }

    let payload;
    try {
      payload = schema.parse(await request.json());
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const issues = validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[Admin Companies] Validation error:', issues);
        return NextResponse.json({ error: `Error de validación: ${issues}` }, { status: 400 });
      }
      throw validationError;
    }
    
    console.log('[Admin Companies] Payload validated:', { name: payload.name, slug: payload.slug });
    
    const supabase = getSupabaseAdminClient();

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', user.email).single();
    console.log('[Admin Companies] Profile found:', profile?.id || 'NOT_FOUND');

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

    if (error) {
      console.error('[Admin Companies] Insert error:', error.code, error.message);
      if (error.code === '23505') {
        return NextResponse.json({ error: `El slug "${payload.slug}" ya está en uso por otra empresa.` }, { status: 400 });
      }
      return NextResponse.json({ error: `Error de BD: ${error.message}` }, { status: 400 });
    }
    
    if (!company) {
      return NextResponse.json({ error: 'No se pudo crear la empresa (sin datos)' }, { status: 500 });
    }

    console.log('[Admin Companies] Company created:', company.id);

    const { error: settingsError } = await supabase.from('company_settings').upsert({
      company_id: company.id,
      brand_name: payload.brandName || payload.name,
      industry: payload.industry,
      primary_color: payload.primaryColor,
      accent_color: payload.accentColor,
      support_email: payload.supportEmail || null,
      support_phone: payload.supportPhone || null,
    });
    
    if (settingsError) {
      console.error('[Admin Companies] Settings error:', settingsError.message);
    }

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

    const { error: agentsError } = await supabase.from('ai_agents').insert(templates);
    if (agentsError) {
      console.error('[Admin Companies] Agents error:', agentsError.message);
    }

    console.log('[Admin Companies] Company creation complete:', company.slug);
    return NextResponse.json({ ok: true, company });
  } catch (error: any) {
    console.error('[Admin Companies] UNHANDLED ERROR:', error?.message, error?.code, error?.stack);
    const msg = error?.message || 'Error inesperado al crear la empresa.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
