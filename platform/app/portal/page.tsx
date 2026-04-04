export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AIPlayground } from '@/components/ai-playground';
import { AutomationForm } from '@/components/automation-form';
import { WhatsAppChannelForm } from '@/components/whatsapp-channel-form';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase';
import { getCompanyBranding, getCurrentUserProfile, getUserCompanies } from '@/lib/tenant';


export default async function PortalPage({ searchParams }: { searchParams?: Promise<{ company?: string }> }) {
  const resolved = await searchParams;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/portal');

  const profile = await getCurrentUserProfile();
  const companies = await getUserCompanies();
  const activeCompany = companies.find((company: any) => company.id === resolved?.company) || companies[0];
  const admin = getSupabaseAdminClient();

  let agents: any[] = [];
  let workflows: any[] = [];
  let logs: any[] = [];
  let aiRuns: any[] = [];
  let branding: any = null;
  if (activeCompany?.id) {
    const [agentsRes, workflowsRes, logsRes, aiRunsRes, brandingRes] = await Promise.all([
      admin.from('ai_agents').select('id, name, model, is_active').eq('company_id', activeCompany.id).order('created_at', { ascending: false }),
      admin.from('automation_workflows').select('id, name, status, target_email, target_phone, channel_type, last_run_at').eq('company_id', activeCompany.id).order('created_at', { ascending: false }),
      admin.from('automation_logs').select('id, status, summary, created_at').eq('company_id', activeCompany.id).order('created_at', { ascending: false }).limit(5),
      admin.from('ai_runs').select('id, input_text, output_text, created_at, agent:ai_agents(name)').eq('company_id', activeCompany.id).order('created_at', { ascending: false }).limit(5),
      getCompanyBranding(activeCompany.id),
    ]);
    agents = agentsRes.data || [];
    workflows = workflowsRes.data || [];
    logs = logsRes.data || [];
    aiRuns = aiRunsRes.data || [];
    branding = brandingRes || null;
  }

  const primary = branding?.primary_color || activeCompany?.settings?.primary_color || '#22d3ee';
  const accent = branding?.accent_color || activeCompany?.settings?.accent_color || '#8b5cf6';
  const brandName = branding?.brand_name || activeCompany?.settings?.brand_name || activeCompany?.name;

  return (
    <main className="container-shell py-16 space-y-8">
      <section className="card p-8" style={{ borderColor: `${primary}55`, boxShadow: `0 0 0 1px ${primary}20 inset` }}>
        <p className="text-sm uppercase tracking-[0.3em]" style={{ color: primary }}>Portal multiempresa</p>
        <h1 className="mt-3 text-4xl font-semibold">{brandName || 'IA real y automatización completa'}</h1>
        <p className="mt-3 text-white/70">Sesión: {profile?.email}. Empresa activa: {activeCompany?.name || 'Sin empresa asignada'}.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {(companies || []).map((company: any) => (
            <Link
              key={company.id}
              href={`/portal?company=${company.id}`}
              className="rounded-full border px-4 py-2 text-sm transition"
              style={{ borderColor: company.id === activeCompany?.id ? primary : 'rgba(255,255,255,0.12)', background: company.id === activeCompany?.id ? `${primary}22` : 'transparent' }}
            >
              {(company.settings?.brand_name || company.name)}
            </Link>
          ))}
        </div>
        {branding?.support_email || branding?.support_phone ? (
          <div className="mt-4 text-sm text-white/60">
            {branding?.support_email ? <span>Soporte: {branding.support_email}</span> : null}
            {branding?.support_email && branding?.support_phone ? <span> · </span> : null}
            {branding?.support_phone ? <span>WhatsApp: {branding.support_phone}</span> : null}
          </div>
        ) : null}
      </section>

      {!activeCompany ? (
        <div className="card p-8 text-white/70">Tu usuario todavía no tiene una empresa asignada. Desde <span className="text-white">/admin/empresas</span> el admin general puede crearla y asignarte como owner.</div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <AIPlayground companyId={activeCompany.id} agents={agents} brandName={brandName} primaryColor={primary} accentColor={accent} />
            <AutomationForm companyId={activeCompany.id} companyName={brandName || activeCompany.name} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <WhatsAppChannelForm companyId={activeCompany.id} />
            <div className="card p-6">
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: primary }}>Agentes por nicho</p>
              <div className="mt-4 space-y-3">
                {agents.length ? agents.map((agent) => (
                  <div key={agent.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-white/60">Modelo: {agent.model}</p>
                  </div>
                )) : <p className="text-white/60">No hay agentes activos.</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6">
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: accent }}>Automatizaciones</p>
              <div className="mt-4 space-y-3">
                {workflows.length ? workflows.map((wf) => (
                  <div key={wf.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-sm text-white/60">Canal: {wf.channel_type} · Estado: {wf.status}</p>
                    <p className="text-sm text-white/50">Destino: {wf.target_email || wf.target_phone || 'No definido'} · Última corrida: {wf.last_run_at ? new Date(wf.last_run_at).toLocaleString('es-AR') : 'Nunca'}</p>
                  </div>
                )) : <p className="text-white/60">No hay automatizaciones creadas.</p>}
              </div>
            </div>

            <div className="card p-6">
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: accent }}>Logs de Automatización</p>
              <div className="mt-4 space-y-4">
                {logs.length ? logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">{new Date(log.created_at).toLocaleString('es-AR')}</p>
                    <p className="mt-2 whitespace-pre-wrap text-white/80">{log.summary}</p>
                  </div>
                )) : <p className="text-white/60">Todavía no hay logs de automatizaciones.</p>}
              </div>
            </div>

            <div className="card p-6">
              <p className="text-sm uppercase tracking-[0.2em]" style={{ color: primary }}>Historial del Playground</p>
              <div className="mt-4 space-y-4">
                {aiRuns.length ? aiRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex justify-between items-center text-xs uppercase tracking-[0.2em] text-white/40">
                      <span>{new Date(run.created_at).toLocaleString('es-AR')}</span>
                      <span>{run.agent?.name}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white/90">U: {run.input_text.slice(0, 100)}{run.input_text.length > 100 ? '...' : ''}</p>
                    <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap border-l-2 border-white/20 pl-2 ml-1">IA: {run.output_text?.slice(0, 150)}{run.output_text?.length > 150 ? '...' : ''}</p>
                  </div>
                )) : <p className="text-white/60">No hay interacciones manuales registradas.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
