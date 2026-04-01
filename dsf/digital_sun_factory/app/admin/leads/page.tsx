import { requireAdminUser } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase';

export default async function AdminLeadsPage() {
  await requireAdminUser();
  const supabase = getSupabaseAdminClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, company, whatsapp, goal, status, affiliate_code, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="container-shell py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">CRM</p>
      <h1 className="mt-3 text-4xl font-semibold">Leads comerciales</h1>
      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Objetivo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Afiliado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(leads || []).map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                  <p className="text-white/50">{lead.email}</p>
                  <p className="text-white/50">{lead.whatsapp || 'Sin WhatsApp'}</p>
                </td>
                <td className="px-4 py-3 align-top text-white/70">{lead.company || '—'}</td>
                <td className="px-4 py-3 align-top text-white/70">{lead.goal}</td>
                <td className="px-4 py-3 align-top"><span className="rounded-full border border-white/10 px-3 py-1 capitalize">{lead.status}</span></td>
                <td className="px-4 py-3 align-top text-white/70">{lead.affiliate_code || 'Directo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
