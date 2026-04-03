import { getSupabaseAdminClient } from '@/lib/supabase';
import { type SupabaseClient } from '@supabase/supabase-js';
import { renderExecutiveSummaryHtml, renderExecutiveSummaryText, type ExecutiveSummaryPayload } from './report-render';
import { sendEmailReport } from './channels/email';
import { sendWhatsAppReport } from './channels/whatsapp';
import { getExecutiveSummary } from './reporting';

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

// Reutilizamos el cliente centralizado que ya tiene limpieza de BOM
export function getServiceSupabase() {
  return getSupabaseAdminClient();
}

export async function buildExecutiveSummary(
  supabase: SupabaseClient,
  companyId: string,
  frequency: ReportSubscriptionRow['frequency']
): Promise<ExecutiveSummaryPayload> {
  const now = new Date();
  const label = getPeriodLabel(frequency);

  const { data: company } = await supabase
    .from('companies')
    .select('id,name')
    .eq('id', companyId)
    .single();

  // Reutilizamos la lógica maestra de reportes de nuestra plataforma SaaS
  // La cual hace joins correctamente con 'crm_opportunities', 'sales_stages' y 'profiles'.
  const dashboardData = await getExecutiveSummary(companyId);

  return {
    companyName: company?.name || 'Empresa',
    periodLabel: label,
    generatedAtIso: now.toISOString(),
    revenue: dashboardData.kpis.won_this_month_amount,
    weightedForecast: dashboardData.kpis.weighted_forecast_amount,
    openOpportunities: dashboardData.kpis.open_pipeline_count,
    wonThisPeriod: dashboardData.kpis.won_this_month_count,
    lostThisPeriod: dashboardData.kpis.lost_this_month_count,
    newConversations: dashboardData.kpis.active_conversations,
    byStage: dashboardData.pipeline_by_stage.map(s => ({
      stage: s.stage,
      count: s.count,
      amount: s.amount
    })),
    topSellers: dashboardData.sales_by_operator.map(op => ({
      owner: op.operator,
      revenue: op.won_amount,
      wins: op.won_count
    })).slice(0, 5) // Mostramos solo top 5
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

function getPeriodLabel(frequency: ReportSubscriptionRow['frequency']) {
  if (frequency === 'daily') return 'Últimas 24 horas';
  if (frequency === 'weekly') return 'Últimos 7 días';
  return 'Últimos 30 días';
}
