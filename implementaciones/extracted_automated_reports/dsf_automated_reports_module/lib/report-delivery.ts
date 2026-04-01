import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { renderExecutiveSummaryHtml, renderExecutiveSummaryText, type ExecutiveSummaryPayload } from './report-render';
import { sendEmailReport } from './channels/email';
import { sendWhatsAppReport } from './channels/whatsapp';

export type ReportSubscriptionRow = {
  id: string;
  company_id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  report_type: string;
  timezone: string;
  send_hour: number;
  weekday: number | null;
  day_of_month: number | null;
  filters: Record<string, unknown>;
  next_run_at: string;
  is_active: boolean;
};

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function buildExecutiveSummary(
  supabase: SupabaseClient,
  companyId: string,
  frequency: ReportSubscriptionRow['frequency']
): Promise<ExecutiveSummaryPayload> {
  const now = new Date();
  const { from, label } = getPeriodWindow(now, frequency);

  const [{ data: company }, opportunitiesRes, conversationsRes] = await Promise.all([
    supabase.from('companies').select('id,name').eq('id', companyId).single(),
    supabase
      .from('opportunities')
      .select('id, amount, probability, stage, status, owner_name, closed_at, created_at')
      .eq('company_id', companyId),
    supabase
      .from('conversations')
      .select('id, created_at')
      .eq('company_id', companyId)
      .gte('created_at', from.toISOString()),
  ]);

  if (opportunitiesRes.error) throw opportunitiesRes.error;
  if (conversationsRes.error) throw conversationsRes.error;

  const opportunities = opportunitiesRes.data || [];
  const conversations = conversationsRes.data || [];

  const revenue = opportunities
    .filter((op) => op.status === 'won' && op.closed_at && new Date(op.closed_at) >= from)
    .reduce((sum, op) => sum + Number(op.amount || 0), 0);

  const weightedForecast = opportunities
    .filter((op) => op.status !== 'won' && op.status !== 'lost')
    .reduce((sum, op) => sum + Number(op.amount || 0) * (Number(op.probability || 0) / 100), 0);

  const openOpportunities = opportunities.filter((op) => !['won', 'lost'].includes(String(op.status))).length;
  const wonThisPeriod = opportunities.filter((op) => op.status === 'won' && op.closed_at && new Date(op.closed_at) >= from).length;
  const lostThisPeriod = opportunities.filter((op) => op.status === 'lost' && op.closed_at && new Date(op.closed_at) >= from).length;

  const byStageMap = new Map<string, { count: number; amount: number }>();
  for (const op of opportunities.filter((row) => !['won', 'lost'].includes(String(row.status)))) {
    const stage = String(op.stage || 'Sin etapa');
    const current = byStageMap.get(stage) || { count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(op.amount || 0);
    byStageMap.set(stage, current);
  }

  const sellerMap = new Map<string, { revenue: number; wins: number }>();
  for (const op of opportunities.filter((row) => row.status === 'won' && row.closed_at && new Date(row.closed_at) >= from)) {
    const owner = String(op.owner_name || 'Sin asignar');
    const current = sellerMap.get(owner) || { revenue: 0, wins: 0 };
    current.revenue += Number(op.amount || 0);
    current.wins += 1;
    sellerMap.set(owner, current);
  }

  return {
    companyName: company?.name || 'Empresa',
    periodLabel: label,
    generatedAtIso: now.toISOString(),
    revenue,
    weightedForecast,
    openOpportunities,
    wonThisPeriod,
    lostThisPeriod,
    newConversations: conversations.length,
    byStage: Array.from(byStageMap.entries()).map(([stage, value]) => ({ stage, ...value })),
    topSellers: Array.from(sellerMap.entries())
      .map(([owner, value]) => ({ owner, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}

export async function deliverSubscription(supabase: SupabaseClient, subscription: ReportSubscriptionRow) {
  const payload = await buildExecutiveSummary(supabase, subscription.company_id, subscription.frequency);
  const html = renderExecutiveSummaryHtml(payload);
  const text = renderExecutiveSummaryText(payload);
  const subject = `Reporte ${subscription.frequency} · ${payload.companyName}`;

  const insertDelivery = await supabase
    .from('report_deliveries')
    .insert({
      subscription_id: subscription.id,
      company_id: subscription.company_id,
      status: 'queued',
      channel: subscription.channel,
      recipient: subscription.recipient,
      payload,
    })
    .select('id')
    .single();

  if (insertDelivery.error) throw insertDelivery.error;

  try {
    let providerResult: unknown;
    if (subscription.channel === 'email') {
      providerResult = await sendEmailReport({
        to: subscription.recipient,
        subject,
        html,
        text,
      });
    } else {
      providerResult = await sendWhatsAppReport({
        to: subscription.recipient,
        body: text,
      });
    }

    const nextRunAt = calculateNextRunAt(subscription);

    await Promise.all([
      supabase
        .from('report_deliveries')
        .update({ status: 'sent', provider_response: providerResult, sent_at: new Date().toISOString() })
        .eq('id', insertDelivery.data.id),
      supabase
        .from('report_subscriptions')
        .update({
          last_sent_at: new Date().toISOString(),
          next_run_at: nextRunAt.toISOString(),
        })
        .eq('id', subscription.id),
    ]);

    return { ok: true, providerResult, nextRunAt };
  } catch (error) {
    await supabase
      .from('report_deliveries')
      .update({ status: 'failed', error_message: error instanceof Error ? error.message : 'unknown error' })
      .eq('id', insertDelivery.data.id);

    throw error;
  }
}

export function calculateNextRunAt(subscription: Pick<ReportSubscriptionRow, 'frequency' | 'send_hour' | 'weekday' | 'day_of_month' | 'timezone'>) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(subscription.send_hour);

  if (subscription.frequency === 'daily') {
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (subscription.frequency === 'weekly') {
    const targetWeekday = subscription.weekday ?? 1;
    const currentWeekday = next.getUTCDay();
    let delta = targetWeekday - currentWeekday;
    if (delta < 0 || (delta === 0 && next <= now)) delta += 7;
    next.setUTCDate(next.getUTCDate() + delta);
    return next;
  }

  const targetDay = Math.max(1, Math.min(28, subscription.day_of_month ?? 1));
  next.setUTCDate(targetDay);
  if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(targetDay);
  return next;
}

function getPeriodWindow(now: Date, frequency: ReportSubscriptionRow['frequency']) {
  if (frequency === 'daily') {
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 1);
    return { from, label: 'Últimas 24 horas' };
  }

  if (frequency === 'weekly') {
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 7);
    return { from, label: 'Últimos 7 días' };
  }

  const from = new Date(now);
  from.setUTCMonth(from.getUTCMonth() - 1);
  return { from, label: 'Últimos 30 días' };
}
