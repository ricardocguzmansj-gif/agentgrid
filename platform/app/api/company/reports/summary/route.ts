import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/lib/reporting";
import { getCurrentCompanyIdOrThrow } from "@/lib/company";

export const runtime = 'edge';

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow();
    const data = await getExecutiveSummary(companyId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar el resumen" },
      { status: 500 },
    );
  }
}
