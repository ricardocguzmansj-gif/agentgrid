# Módulo Kanban Comercial + Forecast

Este paquete agrega un tablero kanban comercial multiempresa para Next.js + Supabase.

## Incluye
- Vista kanban con drag & drop para oportunidades
- Métricas por vendedor
- Forecast de cierres ponderado
- APIs para listar, mover y resumir oportunidades
- Migración SQL `008_kanban_forecast.sql`

## Integración
1. Copiá este contenido dentro de tu proyecto.
2. Ejecutá la migración SQL en Supabase.
3. Asegurate de tener instalado:
   - `@supabase/supabase-js`
   - `react`
   - `next`
4. Ajustá `lib/company.ts` o el helper equivalente para resolver el `company_id` desde la sesión.
5. Montá el componente en una página como `/portal/pipeline`.

## Rutas API
- `GET /api/company/opportunities/kanban`
- `GET /api/company/opportunities/forecast`
- `POST /api/company/opportunities/[id]/move`

## Notas
- El componente usa HTML5 drag and drop para evitar dependencias extra.
- El forecast usa monto ponderado por probabilidad.
- El SQL deja columnas y políticas base; revisá los nombres si ya modificaste tu esquema anterior.
