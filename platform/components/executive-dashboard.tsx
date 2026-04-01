"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

type RevenuePoint = { period: string; revenue: number; weighted_forecast: number };
type StagePoint = { stage: string; count: number; amount: number };
type OperatorPoint = { operator: string; won_amount: number; open_amount: number };

type SummaryPayload = {
  company_id: string;
  currency: string;
  kpis: {
    open_pipeline_amount: number;
    weighted_forecast_amount: number;
    won_this_month_amount: number;
    lost_this_month_count: number;
    active_conversations: number;
    unassigned_conversations: number;
    new_leads_this_month: number;
    conversion_rate_pct: number;
  };
  revenue_trend: RevenuePoint[];
  pipeline_by_stage: StagePoint[];
  sales_by_operator: OperatorPoint[];
};

const piePalette = ["#0f172a", "#1d4ed8", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const res = await fetch("/api/company/reports/summary", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar el dashboard ejecutivo");
        const json = (await res.json()) as SummaryPayload;
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const currency = data?.currency ?? "USD";

  const stagePieData = useMemo(
    () =>
      (data?.pipeline_by_stage ?? []).map((item, index) => ({
        ...item,
        fill: piePalette[index % piePalette.length],
      })),
    [data],
  );

  async function exportPdf() {
    const res = await fetch("/api/company/reports/export/pdf");
    if (!res.ok) throw new Error("No se pudo exportar PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-ejecutivo.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel() {
    const res = await fetch("/api/company/reports/export/excel");
    if (!res.ok) throw new Error("No se pudo exportar Excel");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-ejecutivo.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Cargando reportes ejecutivos…</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {error ?? "No hay datos disponibles"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Executive Reports</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Dashboard ejecutivo</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Revenue, forecast, desempeño comercial y actividad operativa de la empresa en una sola vista.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportPdf} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Exportar PDF
          </button>
          <button onClick={exportExcel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pipeline abierto" value={money(data.kpis.open_pipeline_amount, currency)} hint="Monto total en oportunidades activas" />
        <KpiCard label="Forecast ponderado" value={money(data.kpis.weighted_forecast_amount, currency)} hint="Monto ajustado por probabilidad" />
        <KpiCard label="Ganado este mes" value={money(data.kpis.won_this_month_amount, currency)} hint="Cierres marcados como ganados" />
        <KpiCard label="Tasa de conversión" value={`${data.kpis.conversion_rate_pct.toFixed(1)}%`} hint={`${data.kpis.new_leads_this_month} leads nuevos este mes`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue + forecast</h2>
              <p className="text-sm text-slate-500">Últimos períodos consolidados</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: any) => money(Number(value), currency)} />
                <Area type="monotone" dataKey="revenue" stroke="#1d4ed8" fill="#bfdbfe" name="Revenue" />
                <Area
                  type="monotone"
                  dataKey="weighted_forecast"
                  stroke="#0f172a"
                  fill="#cbd5e1"
                  name="Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pipeline por etapa</h2>
          <p className="text-sm text-slate-500">Distribución actual de oportunidades</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stagePieData} dataKey="amount" nameKey="stage" outerRadius={90} innerRadius={45}>
                  {stagePieData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => money(Number(value), currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {stagePieData.map((item) => (
              <div key={item.stage} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-slate-700">{item.stage}</span>
                </div>
                <div className="font-medium text-slate-900">{money(item.amount, currency)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Performance por vendedor</h2>
          <p className="text-sm text-slate-500">Ganado vs abierto por operador</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sales_by_operator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis />
                <Tooltip formatter={(value: any) => money(Number(value), currency)} />
                <Bar dataKey="won_amount" fill="#1d4ed8" name="Ganado" />
                <Bar dataKey="open_amount" fill="#94a3b8" name="Abierto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Actividad operativa</h2>
          <div className="mt-4 space-y-4">
            <KpiCard label="Conversaciones activas" value={String(data.kpis.active_conversations)} />
            <KpiCard label="Sin asignar" value={String(data.kpis.unassigned_conversations)} />
            <KpiCard label="Perdidas este mes" value={String(data.kpis.lost_this_month_count)} />
          </div>
        </div>
      </div>
    </div>
  );
}
