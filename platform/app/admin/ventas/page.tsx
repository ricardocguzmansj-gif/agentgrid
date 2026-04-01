export const dynamic = 'force-dynamic';
import { requireAdminUser } from '@/lib/auth';

import { getSupabaseAdminClient } from '@/lib/supabase';

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

export default async function AdminSalesPage() {
  await requireAdminUser();
  const supabase = getSupabaseAdminClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, provider, provider_checkout_id, customer_email, plan_id, amount, currency, billing_cycle, status, affiliate_code, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="container-shell py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Revenue</p>
      <h1 className="mt-3 text-4xl font-semibold">Ventas y checkout</h1>
      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Afiliado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(orders || []).map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customer_email}</p>
                  <p className="text-white/50">{new Date(order.created_at).toLocaleString('es-AR')}</p>
                </td>
                <td className="px-4 py-3 capitalize">{order.plan_id} <span className="text-white/50">({order.billing_cycle})</span></td>
                <td className="px-4 py-3">{money(Number(order.amount || 0))} <span className="text-white/50 uppercase">{order.currency}</span></td>
                <td className="px-4 py-3"><span className="rounded-full border border-white/10 px-3 py-1 capitalize">{order.status}</span></td>
                <td className="px-4 py-3 capitalize">{order.provider}</td>
                <td className="px-4 py-3">{order.affiliate_code || 'Directo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
