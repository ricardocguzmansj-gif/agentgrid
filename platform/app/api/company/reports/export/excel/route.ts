import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/lib/reporting";
import { getCurrentCompanyIdOrThrow } from "@/lib/company";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow();
    const summary = await getExecutiveSummary(companyId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AgentGrid";
    workbook.lastModifiedBy = "AgentGrid";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet: KPIs
    const kpiSheet = workbook.addWorksheet("KPIs");
    kpiSheet.columns = [
      { header: "KPI", key: "name", width: 30 },
      { header: "Valor", key: "value", width: 20 },
    ];

    kpiSheet.addRows([
      { name: "Pipeline abierto", value: summary.kpis.open_pipeline_amount },
      { name: "Forecast ponderado", value: summary.kpis.weighted_forecast_amount },
      { name: "Ganado este mes", value: summary.kpis.won_this_month_amount },
      { name: "Perdidas este mes", value: summary.kpis.lost_this_month_count },
      { name: "Conversaciones activas", value: summary.kpis.active_conversations },
      { name: "Sin asignar", value: summary.kpis.unassigned_conversations },
      { name: "Leads nuevos", value: summary.kpis.new_leads_this_month },
      { name: "Conversión %", value: summary.kpis.conversion_rate_pct },
    ]);

    // Sheet: Pipeline
    const pipelineSheet = workbook.addWorksheet("Pipeline");
    pipelineSheet.columns = [
      { header: "Etapa", key: "stage", width: 20 },
      { header: "Cantidad", key: "count", width: 15 },
      { header: "Monto", key: "amount", width: 20 },
    ];
    pipelineSheet.addRows(
      summary.pipeline_by_stage.map((r) => ({
        stage: r.stage,
        count: r.count,
        amount: r.amount,
      }))
    );

    // Sheet: Vendedores
    const salesSheet = workbook.addWorksheet("Vendedores");
    salesSheet.columns = [
      { header: "Operador", key: "operator", width: 30 },
      { header: "Ganado", key: "won", width: 20 },
      { header: "Abierto", key: "open", width: 20 },
    ];
    salesSheet.addRows(
      summary.sales_by_operator.map((r) => ({
        operator: r.operator,
        won: r.won_amount,
        open: r.open_amount,
      }))
    );

    // Sheet: Revenue
    const revenueSheet = workbook.addWorksheet("Revenue");
    revenueSheet.columns = [
      { header: "Periodo", key: "period", width: 20 },
      { header: "Revenue", key: "revenue", width: 20 },
      { header: "Forecast", key: "forecast", width: 20 },
    ];
    revenueSheet.addRows(
      summary.revenue_trend.map((r) => ({
        period: r.period,
        revenue: r.revenue,
        forecast: r.weighted_forecast,
      }))
    );

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reporte-ejecutivo.xlsx"',
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo exportar Excel" },
      { status: 500 },
    );
  }
}
