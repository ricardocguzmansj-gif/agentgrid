import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin-data';


function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

export default async function AdminPage() {
  const user = await requireAdminUser();
  const { stats, leadStatusCounts, recentLeads } = await getAdminDashboardData();

  const cards = [
    ['Leads', String(stats.leads)],
    ['Afiliados', String(stats.affiliates)],
    ['Referidos', String(stats.referrals)],
    ['Órdenes pagas', String(stats.paidOrders)],
    ['MRR estimado', money(stats.mrr)],
    ['Ingresos', money(stats.revenue)],
    ['Comisiones', money(stats.commissions)],
    ['Follow-ups pendientes', String(stats.pendingEvents)],
  ];

  return (
    <main className="container-shell py-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Panel admin</p>
          <h1 className="mt-3 text-4xl font-semibold">Operación comercial Digital Sun</h1>
          <p className="mt-3 text-white/70">Sesión activa: {user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/leads" className="button-secondary">Ver leads</Link>
          <Link href="/admin/empresas" className="button-secondary">Empresas</Link>
          <Link href="/admin/ventas" className="button-secondary">Ver ventas</Link>
          <Link href="/pricing" className="button-primary">Ir a pricing</Link>
        </div>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-white/50">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Pipeline</p>
          <div className="mt-5 space-y-4">
            {Object.entries(leadStatusCounts).length ? Object.entries(leadStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="capitalize text-white/70">{status}</span>
                <span className="text-2xl font-semibold">{count}</span>
              </div>
            )) : <p className="text-white/60">Todavía no hay leads cargados.</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Leads recientes</p>
              <h2 className="mt-2 text-2xl font-semibold">Últimos ingresos del funnel</h2>
            </div>
            <Link href="/admin/leads" className="text-sm text-cyan-200 underline underline-offset-4">Abrir CRM</Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Afiliado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                      <p className="text-white/50">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3 text-white/70">{lead.company || '—'}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-white/10 px-3 py-1 capitalize">{lead.status}</span></td>
                    <td className="px-4 py-3 text-white/70">{lead.affiliate_code || 'Directo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
