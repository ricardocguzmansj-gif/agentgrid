import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/lib/reporting";
import { getCurrentCompanyIdOrThrow } from "@/lib/company";

export const runtime = 'edge';

export async function GET() {
  try {
    const XLSX = await import("xlsx");
    const companyId = await getCurrentCompanyIdOrThrow();
    const summary = await getExecutiveSummary(companyId);

    const workbook = XLSX.utils.book_new();

    const kpis = [
      ["KPI", "Valor"],
      ["Pipeline abierto", summary.kpis.open_pipeline_amount],
      ["Forecast ponderado", summary.kpis.weighted_forecast_amount],
      ["Ganado este mes", summary.kpis.won_this_month_amount],
      ["Perdidas este mes", summary.kpis.lost_this_month_count],
      ["Conversaciones activas", summary.kpis.active_conversations],
      ["Sin asignar", summary.kpis.unassigned_conversations],
      ["Leads nuevos", summary.kpis.new_leads_this_month],
      ["Conversión %", summary.kpis.conversion_rate_pct],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(kpis), "KPIs");

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summary.pipeline_by_stage.map((r) => ({ etapa: r.stage, cantidad: r.count, monto: r.amount }))),
      "Pipeline",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summary.sales_by_operator.map((r) => ({ operador: r.operator, ganado: r.won_amount, abierto: r.open_amount }))),
      "Vendedores",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summary.revenue_trend.map((r) => ({ periodo: r.period, revenue: r.revenue, forecast: r.weighted_forecast }))),
      "Revenue",
    );

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte-ejecutivo.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo exportar Excel" },
      { status: 500 },
    );
  }
}
