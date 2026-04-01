import { getSupabaseAdminClient } from '@/lib/supabase';

export async function getAdminDashboardData() {
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const [
    leadsRes,
    affiliatesRes,
    referralsRes,
    ordersRes,
    pendingEventsRes,
    recentLeadsRes,
    commissionsRes,
  ] = await Promise.all([
    supabase.from('leads').select('id, status', { count: 'exact', head: false }),
    supabase.from('affiliates').select('id', { count: 'exact', head: false }),
    supabase.from('affiliate_referrals').select('id', { count: 'exact', head: false }),
    supabase.from('orders').select('id, amount, status, billing_cycle', { count: 'exact', head: false }),
    supabase.from('lead_events').select('id', { count: 'exact', head: false }).eq('status', 'pending').lte('scheduled_for', nowIso),
    supabase.from('leads').select('id, first_name, last_name, email, company, status, created_at, affiliate_code').order('created_at', { ascending: false }).limit(8),
    supabase.from('affiliate_referrals').select('commission_amount, referral_status'),
  ]);

  const paidOrders = (ordersRes.data || []).filter((order) => order.status === 'paid');
  const monthlyMrr = paidOrders
    .filter((order) => order.billing_cycle === 'monthly')
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const annualMrrEquivalent = paidOrders
    .filter((order) => order.billing_cycle === 'annual')
    .reduce((sum, order) => sum + Number(order.amount || 0) / 12, 0);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

  const leadStatusCounts = (leadsRes.data || []).reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const totalCommission = (commissionsRes.data || []).reduce((sum, row) => sum + Number(row.commission_amount || 0), 0);

  return {
    stats: {
      leads: leadsRes.count || 0,
      affiliates: affiliatesRes.count || 0,
      referrals: referralsRes.count || 0,
      orders: ordersRes.count || 0,
      paidOrders: paidOrders.length,
      pendingEvents: pendingEventsRes.count || 0,
      mrr: monthlyMrr + annualMrrEquivalent,
      revenue: totalRevenue,
      commissions: totalCommission,
    },
    leadStatusCounts,
    recentLeads: recentLeadsRes.data || [],
  };
}
