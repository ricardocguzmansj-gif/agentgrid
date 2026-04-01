import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { generateAIResponse } from '@/lib/ai';
import { getCurrentUserProfile, userCanAccessCompany } from '@/lib/tenant';

const schema = z.object({
  companyId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  message: z.string().min(5),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const profile = await getCurrentUserProfile();
    if (!profile) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    if (!(await userCanAccessCompany(payload.companyId))) {
      return NextResponse.json({ error: 'No autorizado para esta empresa.' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    let agent: any = null;
    if (payload.agentId) {
      const res = await supabase
        .from('ai_agents')
        .select('id, name, model, system_prompt, temperature')
        .eq('id', payload.agentId)
        .eq('company_id', payload.companyId)
        .single();
      agent = res.data;
      if (res.error || !agent) throw res.error ?? new Error('No se encontró el agente');
    }

    if (!agent) {
      const { data: fallbackAgent } = await supabase
        .from('ai_agents')
        .select('id, name, model, system_prompt, temperature')
        .eq('company_id', payload.companyId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      agent = fallbackAgent;
    }

    if (!agent) {
      return NextResponse.json({ error: 'Primero creá un agente para la empresa.' }, { status: 400 });
    }

    const { data: runRow } = await supabase
      .from('ai_runs')
      .insert({
        company_id: payload.companyId,
        agent_id: agent.id,
        user_id: profile.id,
        input_text: payload.message,
        model: agent.model,
        status: 'running',
      })
      .select('id')
      .single();

    const response = await generateAIResponse({
      systemPrompt: agent.system_prompt,
      input: payload.message,
      model: agent.model,
      temperature: Number(agent.temperature || 0.3),
    });

    await supabase
      .from('ai_runs')
      .update({
        output_text: response.text,
        provider_response_id: response.id,
        usage_input_tokens: response.inputTokens,
        usage_output_tokens: response.outputTokens,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runRow?.id);

    return NextResponse.json({ ok: true, output: response.text, runId: runRow?.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo ejecutar la IA.' }, { status: 400 });
  }
}
