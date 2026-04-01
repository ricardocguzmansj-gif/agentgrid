# Digital Sun SaaS Factory — Continuación visual completa

Esta versión agrega el panel visual que faltaba para demo y operación:

- **Admin general** en `/admin/companies`
  - crea empresas desde UI
  - selector de tenant
  - tarjetas con métricas
  - vista rápida de mensajes recientes
- **Portal por empresa** en `/portal`
  - selector de empresa
  - alta de agentes desde UI
  - alta de workflows desde UI
  - configuración de canal de WhatsApp desde UI
  - playground real con OpenAI
  - listado de agentes y automatizaciones
  - conversaciones recientes
- Nuevas APIs internas:
  - `GET/POST /api/company/agents`
  - `GET/POST /api/company/workflows`
  - `GET/POST /api/company/whatsapp-channel`
  - `GET /api/company/conversations`
  - `GET /api/company/overview`

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variables mínimas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_VERIFY_TOKEN`
- `CLOUDFLARE_CRON_SECRET`

## Rutas

- `/`
- `/admin/companies`
- `/portal`
- `/api/webhooks/whatsapp`
- `/api/cron/automations`

## Sugerencia de prueba

1. Ejecutar la migración `005_inbound_whatsapp_and_multitenant.sql`.
2. Crear un usuario y cargarlo en `profiles`.
3. Ponerlo como `platform_admin`.
4. Crear una empresa desde `/admin/companies`.
5. Ir a `/portal?companyId=...`.
6. Crear un agente, un workflow y el canal de WhatsApp.
7. Configurar Meta apuntando al webhook.
8. Probar un mensaje real y revisar la conversación en el portal.

## Importante

Esta versión prioriza **demo comercial y operación rápida**. Antes de producción enterprise conviene agregar:

- autenticación de rutas por rol
- cifrado de tokens por tenant
- colas para reintentos
- dashboard de analytics
- auditoría y observabilidad
