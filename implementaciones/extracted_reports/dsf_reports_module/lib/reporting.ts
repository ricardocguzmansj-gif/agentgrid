import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan credenciales de Supabase");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getExecutiveSummary(companyId: string) {
  const supabase = adminClient();

  const [oppsRes, convRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id,title,stage,amount,probability,owner_name,created_at,closed_at")
      .eq("company_id", companyId),
    supabase
      .from("conversations")
      .select("id,status,assigned_user_id,created_at")
      .eq("company_id", companyId),
  ]);

  if (oppsRes.error) throw oppsRes.error;
  if (convRes.error) throw convRes.error;

  const opportunities = oppsRes.data ?? [];
  const conversations = convRes.data ?? [];
  const currency = "USD";
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const openOpps = opportunities.filter((o) => !["Won", "Lost", "Closed Won", "Closed Lost"].includes(o.stage));
  const wonThisMonth = opportunities.filter((o) => {
    const closed = o.closed_at ? new Date(o.closed_at) : null;
    return ["Won", "Closed Won"].includes(o.stage) && closed && closed >= monthStart;
  });
  const lostThisMonth = opportunities.filter((o) => {
    const closed = o.closed_at ? new Date(o.closed_at) : null;
    return ["Lost", "Closed Lost"].includes(o.stage) && closed && closed >= monthStart;
  });
  const leadsThisMonth = opportunities.filter((o) => new Date(o.created_at) >= monthStart);

  const openPipelineAmount = openOpps.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const weightedForecastAmount = openOpps.reduce(
    (acc, item) => acc + Number(item.amount || 0) * (Number(item.probability || 0) / 100),
    0,
  );
  const wonThisMonthAmount = wonThisMonth.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  const conversionRatePct = leadsThisMonth.length
    ? (wonThisMonth.length / Math.max(leadsThisMonth.length, 1)) * 100
    : 0;

  const activeConversations = conversations.filter((c) => c.status !== "closed").length;
  const unassignedConversations = conversations.filter((c) => !c.assigned_user_id).length;

  const byStageMap = new Map<string, { stage: string; count: number; amount: number }>();
  for (const opp of opportunities) {
    const key = opp.stage || "Sin etapa";
    const current = byStageMap.get(key) ?? { stage: key, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(opp.amount || 0);
    byStageMap.set(key, current);
  }

  const byOperatorMap = new Map<string, { operator: string; won_amount: number; open_amount: number }>();
  for (const opp of opportunities) {
    const operator = opp.owner_name || "Sin asignar";
    const current = byOperatorMap.get(operator) ?? { operator, won_amount: 0, open_amount: 0 };
    if (["Won", "Closed Won"].includes(opp.stage)) current.won_amount += Number(opp.amount || 0);
    else if (!["Lost", "Closed Lost"].includes(opp.stage)) current.open_amount += Number(opp.amount || 0);
    byOperatorMap.set(operator, current);
  }

  const revenueTrend = buildRevenueTrend(opportunities);

  return {
    company_id: companyId,
    currency,
    kpis: {
      open_pipeline_amount: openPipelineAmount,
      weighted_forecast_amount: weightedForecastAmount,
      won_this_month_amount: wonThisMonthAmount,
      lost_this_month_count: lostThisMonth.length,
      active_conversations: activeConversations,
      unassigned_conversations: unassignedConversations,
      new_leads_this_month: leadsThisMonth.length,
      conversion_rate_pct: Number(conversionRatePct.toFixed(1)),
    },
    revenue_trend: revenueTrend,
    pipeline_by_stage: Array.from(byStageMap.values()).sort((a, b) => b.amount - a.amount),
    sales_by_operator: Array.from(byOperatorMap.values()).sort((a, b) => b.won_amount - a.won_amount),
  };
}

function buildRevenueTrend(opportunities: Array<Record<string, unknown>>) {
  const map = new Map<string, { period: string; revenue: number; weighted_forecast: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = d.toLocaleString("en-US", { month: "short" });
    map.set(period, { period, revenue: 0, weighted_forecast: 0 });
  }

  for (const opp of opportunities) {
    const createdAt = opp.created_at ? new Date(String(opp.created_at)) : null;
    if (!createdAt) continue;
    const period = createdAt.toLocaleString("en-US", { month: "short" });
    const bucket = map.get(period);
    if (!bucket) continue;
    const amount = Number(opp.amount || 0);
    const probability = Number(opp.probability || 0) / 100;
    if (["Won", "Closed Won"].includes(String(opp.stage))) bucket.revenue += amount;
    else if (!["Lost", "Closed Lost"].includes(String(opp.stage))) bucket.weighted_forecast += amount * probability;
  }

  return Array.from(map.values());
}
