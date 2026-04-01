import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan credenciales de Supabase");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getExecutiveSummary(companyId: string) {
  const supabase = adminClient();

  // Obtenemos oportunidades, etapas y dueños en paralelo para armar la lógica local de forma segura
  const [oppsRes, convRes, stagesRes, profilesRes] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("*")
      .eq("company_id", companyId),
    supabase
      .from("conversations")
      .select("id,status,assigned_user_id,created_at")
      .eq("company_id", companyId),
    supabase
      .from("sales_stages")
      .select("*")
      .eq("company_id", companyId),
    supabase
      .from("profiles")
      .select("id,full_name")
  ]);

  if (oppsRes.error) throw oppsRes.error;
  if (convRes.error) throw convRes.error;

  const rawOpportunities = oppsRes.data ?? [];
  const conversations = convRes.data ?? [];
  const stages = stagesRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  // Mapeamos para acceso rápido
  const stageMap = new Map(stages.map(s => [s.id, s]));
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  // Normalizamos las oportunidades para que calcen con la lógica del reporte
  const opportunities = rawOpportunities.map(opp => {
    const stage = stageMap.get(opp.stage_id);
    const owner = profileMap.get(opp.owner_user_id);
    return {
      ...opp,
      stage_name: stage?.name || "Sin etapa",
      is_won: stage?.is_closed_won || false,
      is_lost: stage?.is_closed_lost || false,
      owner_name: owner?.full_name || "Sin asignar",
      // Asumimos 100% si ganó, 0% si perdió, 50% genérico para abiertas si no hay columna real
      probability: stage?.is_closed_won ? 100 : (stage?.is_closed_lost ? 0 : 50) 
    };
  });

  const currency = "USD";
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const openOpps = opportunities.filter(o => !o.is_won && !o.is_lost);
  
  const wonThisMonth = opportunities.filter((o) => {
    const d = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
    return o.is_won && d >= monthStart;
  });
  
  const lostThisMonth = opportunities.filter((o) => {
    const d = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
    return o.is_lost && d >= monthStart;
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
    const key = opp.stage_name;
    const current = byStageMap.get(key) ?? { stage: key, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(opp.amount || 0);
    byStageMap.set(key, current);
  }

  const byOperatorMap = new Map<string, { operator: string; won_amount: number; open_amount: number }>();
  for (const opp of opportunities) {
    const operator = opp.owner_name;
    const current = byOperatorMap.get(operator) ?? { operator, won_amount: 0, open_amount: 0 };
    if (opp.is_won) current.won_amount += Number(opp.amount || 0);
    else if (!opp.is_lost) current.open_amount += Number(opp.amount || 0);
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

function buildRevenueTrend(opportunities: Array<any>) {
  const map = new Map<string, { period: string; revenue: number; weighted_forecast: number }>();
  const now = new Date();
  
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = d.toLocaleString("es-AR", { month: "short" });
    map.set(period, { period, revenue: 0, weighted_forecast: 0 });
  }

  for (const opp of opportunities) {
    const createdAt = opp.created_at ? new Date(String(opp.created_at)) : null;
    if (!createdAt) continue;
    const period = createdAt.toLocaleString("es-AR", { month: "short" });
    const bucket = map.get(period);
    if (!bucket) continue;
    
    const amount = Number(opp.amount || 0);
    const probability = Number(opp.probability || 0) / 100;
    
    if (opp.is_won) {
      bucket.revenue += amount;
    } else if (!opp.is_lost) {
      bucket.weighted_forecast += amount * probability;
    }
  }

  return Array.from(map.values());
}
