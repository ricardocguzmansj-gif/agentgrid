# Digital Sun Factory — Reports Module

Este módulo agrega:
- dashboard ejecutivo con gráficos
- KPIs de revenue, forecast y performance comercial
- exportación PDF
- exportación Excel (.xlsx)
- migración para snapshots de reporting

## Archivos
- `components/executive-dashboard.tsx`
- `lib/reporting.ts`
- `app/api/company/reports/summary/route.ts`
- `app/api/company/reports/export/pdf/route.ts`
- `app/api/company/reports/export/excel/route.ts`
- `supabase/migrations/009_reporting_snapshots.sql`

## Dependencias a instalar
```bash
npm install recharts pdf-lib xlsx
```

## Integración sugerida
1. Copiá los archivos en tu proyecto actual.
2. Ejecutá la migración `009_reporting_snapshots.sql` en Supabase.
3. Asegurate de tener un helper `getCurrentCompanyIdOrThrow()` en `lib/company.ts`.
4. Montá el componente en una página como:

```tsx
import ExecutiveDashboard from "@/components/executive-dashboard";

export default function ReportsPage() {
  return <ExecutiveDashboard />;
}
```

## Ruta recomendada
- `/portal/reports`

## Notas
- El cálculo usa tablas existentes: `opportunities` y `conversations`.
- Si tus nombres de columnas difieren, ajustá `lib/reporting.ts`.
- El PDF sale como reporte ejecutivo compacto listo para demo y cliente final.
