# DSF Automated Reports Module

Módulo para reportes automáticos por **email** y **WhatsApp**, con frecuencia **diaria, semanal y mensual**, listo para integrarse a tu proyecto Next.js + Supabase + Cloudflare.

## Qué agrega

- Suscripciones de reportes por empresa
- Envío por email o WhatsApp
- Frecuencias: `daily`, `weekly`, `monthly`
- Endpoint cron para disparo automático
- Bitácora de entregas
- Reintentos básicos y cálculo del próximo envío
- UI para administrar suscripciones desde el portal
- Envío de prueba manual

## Archivos principales

- `supabase/migrations/010_report_subscriptions.sql`
- `app/api/company/report-subscriptions/route.ts`
- `app/api/company/report-subscriptions/[id]/route.ts`
- `app/api/company/reports/test-delivery/route.ts`
- `app/api/cron/report-deliveries/route.ts`
- `components/report-subscriptions-manager.tsx`
- `lib/report-delivery.ts`
- `lib/report-render.ts`
- `lib/channels/email.ts`
- `lib/channels/whatsapp.ts`

## Variables de entorno

Copiá esto en tu `.env.local`:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=pon_un_token_seguro
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email - opción 1: Resend
RESEND_API_KEY=
REPORTS_FROM_EMAIL=reportes@tudominio.com

# Email - opción 2: SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false

# WhatsApp Meta Cloud API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=v23.0
```

## Instalación

1. Copiá estos archivos dentro de tu proyecto.
2. Ejecutá la migración `010_report_subscriptions.sql` en Supabase.
3. Instalá dependencias:

```bash
npm install @supabase/supabase-js nodemailer resend
```

4. Montá el componente `ReportSubscriptionsManager` en una página como `/portal/reportes-automaticos`.
5. Configurá tu cron para llamar:

```text
POST /api/cron/report-deliveries
Authorization: Bearer TU_CRON_SECRET
```

## Ejemplo Cloudflare Worker Cron

```ts
export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(fetch(`${env.APP_URL}/api/cron/report-deliveries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
    }));
  },
};
```

## Integración esperada

Este módulo asume que tu proyecto ya tiene:

- tabla `companies`
- tabla `opportunities`
- tabla `conversations`
- helper `getCurrentCompanyIdOrThrow()`
- algún sistema de autenticación para distinguir admin/usuario

Si tus helpers usan otros nombres, ajustá los imports en los route handlers.
