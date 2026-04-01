# Digital Sun SaaS Factory

Versión ampliada con:
- **IA real con OpenAI** usando la ruta `/api/ai/run`.
- **Automatizaciones multicanal** por email o WhatsApp.
- **Multitenancy**: un admin general puede crear múltiples empresas y asignar usuarios.
- **Portal por empresa** con branding propio, agentes por nicho y WhatsApp dedicado.
- **Supabase Auth + tablas propias** para perfiles, empresas, membresías, agentes, runs, settings y logs.

## Lo nuevo en esta versión

### 1) Multiempresa vendible
El admin general puede:
- crear empresas
- asignar owner inicial
- definir industria
- crear branding base
- generar automáticamente agentes por nicho

Ruta clave: `/admin/empresas`

### 2) Branding por empresa
Nuevas tablas:
- `company_settings`
- `whatsapp_channels`

Cada tenant puede tener:
- nombre de marca
- colores
- soporte
- WhatsApp propio

### 3) WhatsApp real
Rutas nuevas:
- `/api/whatsapp-channel`
- `/api/whatsapp/send`

Se puede usar por empresa con:
- **Meta WhatsApp Cloud API**
- **Twilio WhatsApp**

### 4) Agentes por nicho
Al crear una empresa se generan agentes listos según industria:
- general
- ecommerce
- clínica
- inmobiliaria
- educación

### 5) Automatización completa
Ruta: `/api/cron/automations`
- toma workflows activos
- resume leads/ventas con IA
- envía salida por email o WhatsApp
- registra logs

## Instalación local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abrir:
- `http://localhost:3000`
- portal multiempresa: `http://localhost:3000/portal`
- admin empresas: `http://localhost:3000/admin/empresas`

## Variables nuevas

Agregar en `.env.local`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Migraciones de Supabase

Ejecutar en orden:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_commerce_and_auth.sql`
3. `supabase/migrations/003_multitenant_ai.sql`
4. `supabase/migrations/004_branding_whatsapp_multichannel.sql`

## Flujo recomendado para probar

1. crear usuario en `/login`
2. en Supabase, en `profiles`, cambiar el rol a `platform_admin`
3. entrar a `/admin/empresas`
4. crear una empresa con industria, branding y owner
5. entrar a `/portal`
6. elegir empresa activa
7. usar el playground de IA
8. configurar WhatsApp por empresa
9. crear automatización por email o WhatsApp
10. probar cron en `/api/cron/automations`

## Validación realizada

- El proyecto actualizado pasó **type-check** con:

```bash
node node_modules/typescript/bin/tsc --noEmit
```

- Antes de producción conviene correr además:

```bash
npm run build
```

## Cloudflare

La carpeta `cloudflare/` sigue incluida para tus cron jobs. Para producción en Cloudflare, conectá el cron a:
- `/api/cron/automations`
- `/api/cron/followups`

## Nota importante

Las credenciales de WhatsApp por empresa se guardan en base de datos porque este starter está orientado a demo comercial y MVP serio. Antes de salir a producción enterprise te conviene cifrarlas o moverlas a un secret manager.
