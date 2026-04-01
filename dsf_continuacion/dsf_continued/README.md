# Digital Sun SaaS Factory — Continuación real

Esta entrega agrega lo que faltaba para seguir avanzando de verdad:

- webhook inbound de WhatsApp en `app/api/webhooks/whatsapp/route.ts`
- verificación `GET` con `hub.challenge`
- procesamiento `POST` de mensajes entrantes
- respuesta automática con OpenAI Responses API
- guardado de mensajes entrantes y salientes en Supabase
- creación multiempresa por admin general en `app/api/admin/companies/route.ts`
- cron endpoint para automatizaciones en `app/api/cron/automations/route.ts`
- worker de ejemplo para Cloudflare en `workers/cron-proxy.js`
- migración SQL con RLS multi-tenant en `supabase/migrations/005_inbound_whatsapp_and_multitenant.sql`

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variables necesarias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_VERIFY_TOKEN`
- `CLOUDFLARE_CRON_SECRET`

## Supabase

1. Crear proyecto.
2. Ejecutar la migración `005_inbound_whatsapp_and_multitenant.sql`.
3. Insertar al menos un registro en `profiles` para tu usuario admin.
4. Marcar `platform_role = 'platform_admin'` para ese usuario.

## Crear una empresa

Hacé un `POST` a `/api/admin/companies` con este JSON:

```json
{
  "name": "Clínica San Juan",
  "slug": "clinica-san-juan",
  "industry": "clinic",
  "ownerEmail": "owner@example.com",
  "brandPrimary": "#00a884",
  "brandSecondary": "#0b141a"
}
```

## Configurar WhatsApp Cloud API

1. En Meta, crear app y número de prueba.
2. Configurar callback URL apuntando a:
   - `https://TU_DOMINIO/api/webhooks/whatsapp`
3. Configurar el verify token igual a `WHATSAPP_VERIFY_TOKEN`.
4. Insertar un registro en `whatsapp_channels` con:
   - `company_id`
   - `meta_phone_number_id`
   - `meta_access_token`

## Probar webhook localmente

Con ngrok o Cloudflare Tunnel, exponer tu localhost y usar esa URL en Meta.

## Cloudflare Cron

Podés llamar al endpoint de automatizaciones cada 15 minutos. La llamada debe enviar:

```http
x-cron-secret: TU_SECRETO
```

## Lo que falta para producción enterprise

- cifrar tokens por tenant
- panel visual completo para empresas
- colas para reintentos
- rate limiting por canal
- plantillas aprobadas por WhatsApp para mensajes outbound proactivos
- auditoría y observabilidad
