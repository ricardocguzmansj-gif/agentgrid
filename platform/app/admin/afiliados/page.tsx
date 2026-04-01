import { requireAdminUser } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase';

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

export default async function AdminAffiliatesPage() {
  await requireAdminUser();
  const supabase = getSupabaseAdminClient();
  const { data: affiliates } = await supabase
    .from('affiliates')
    .select('id, name, email, affiliate_code, commission_rate, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  const { data: referrals } = await supabase
    .from('affiliate_referrals')
    .select('affiliate_code, referral_status, commission_amount');

  const totals = new Map<string, { count: number; commission: number }>();
  (referrals || []).forEach((item) => {
    const current = totals.get(item.affiliate_code) || { count: 0, commission: 0 };
    current.count += 1;
    current.commission += Number(item.commission_amount || 0);
    totals.set(item.affiliate_code, current);
  });

  return (
    <main className="container-shell py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Partners</p>
      <h1 className="mt-3 text-4xl font-semibold">Programa de afiliados</h1>
      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-3">Afiliado</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Referidos</th>
              <th className="px-4 py-3">Comisiones</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(affiliates || []).map((affiliate) => {
              const summary = totals.get(affiliate.affiliate_code) || { count: 0, commission: 0 };
              return (
                <tr key={affiliate.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{affiliate.name}</p>
                    <p className="text-white/50">{affiliate.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-white/80">{affiliate.affiliate_code}</td>
                  <td className="px-4 py-3">{summary.count}</td>
                  <td className="px-4 py-3">{money(summary.commission)}</td>
                  <td className="px-4 py-3"><span className="rounded-full border border-white/10 px-3 py-1 capitalize">{affiliate.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
