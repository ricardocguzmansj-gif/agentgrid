import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/lib/reporting";
import { getCurrentCompanyIdOrThrow } from "@/lib/company";


export async function GET() {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const companyId = await getCurrentCompanyIdOrThrow();
    const summary = await getExecutiveSummary(companyId);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.06, 0.09, 0.16) });
    page.drawText("Digital Sun SaaS Factory", { x: 36, y: height - 42, size: 22, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Reporte Ejecutivo", { x: 36, y: height - 62, size: 11, font, color: rgb(0.8, 0.86, 0.94) });

    const rows = [
      ["Pipeline abierto", currency(summary.kpis.open_pipeline_amount, summary.currency)],
      ["Forecast ponderado", currency(summary.kpis.weighted_forecast_amount, summary.currency)],
      ["Ganado este mes", currency(summary.kpis.won_this_month_amount, summary.currency)],
      ["Conversión", `${summary.kpis.conversion_rate_pct.toFixed(1)}%`],
      ["Conversaciones activas", String(summary.kpis.active_conversations)],
      ["Sin asignar", String(summary.kpis.unassigned_conversations)],
    ];

    let y = height - 110;
    page.drawText("KPIs principales", { x: 36, y, size: 15, font: bold, color: rgb(0.06, 0.09, 0.16) });
    y -= 22;
    rows.forEach(([label, value], index) => {
      page.drawRectangle({
        x: 36,
        y: y - 8,
        width: 360,
        height: 22,
        color: index % 2 === 0 ? rgb(0.96, 0.97, 0.99) : rgb(1, 1, 1),
      });
      page.drawText(label, { x: 44, y, size: 11, font, color: rgb(0.2, 0.25, 0.32) });
      page.drawText(value, { x: 260, y, size: 11, font: bold, color: rgb(0.06, 0.09, 0.16) });
      y -= 24;
    });

    y -= 16;
    page.drawText("Pipeline por etapa", { x: 36, y, size: 15, font: bold, color: rgb(0.06, 0.09, 0.16) });
    y -= 22;
    summary.pipeline_by_stage.slice(0, 8).forEach((row) => {
      page.drawText(`${row.stage}: ${currency(row.amount, summary.currency)} (${row.count})`, {
        x: 44,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.25, 0.32),
      });
      y -= 18;
    });

    let rightY = height - 110;
    page.drawText("Performance por vendedor", { x: 450, y: rightY, size: 15, font: bold, color: rgb(0.06, 0.09, 0.16) });
    rightY -= 22;
    summary.sales_by_operator.slice(0, 8).forEach((row) => {
      page.drawText(`${row.operator}`, { x: 458, y: rightY, size: 11, font: bold, color: rgb(0.1, 0.15, 0.22) });
      rightY -= 14;
      page.drawText(
        `Ganado ${currency(row.won_amount, summary.currency)} | Abierto ${currency(row.open_amount, summary.currency)}`,
        { x: 458, y: rightY, size: 10, font, color: rgb(0.35, 0.4, 0.45) },
      );
      rightY -= 18;
    });

    page.drawText(`Generado: ${new Date().toLocaleString("es-AR")}`, {
      x: 36,
      y: 24,
      size: 10,
      font,
      color: rgb(0.45, 0.5, 0.56),
    });

    const bytes = await pdf.save();
    return new NextResponse(bytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte-ejecutivo.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo exportar PDF" },
      { status: 500 },
    );
  }
}

function currency(value: number, code: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(value || 0);
}
