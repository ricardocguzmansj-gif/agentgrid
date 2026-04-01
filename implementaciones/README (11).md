# Digital Sun Factory — Módulo CRM Conversacional en tiempo real

Este paquete agrega una bandeja de conversaciones estilo CRM para un proyecto Next.js + Supabase.

## Incluye
- Vista `/portal/conversations`
- API para listar conversaciones por empresa
- API para listar mensajes por conversación
- API para enviar respuesta manual
- Suscripción en tiempo real con Supabase Realtime
- Migración SQL para tablas `conversations` y `messages`

## Requisitos
- Next.js App Router
- Supabase JS v2
- Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Instalación
1. Copiá los archivos dentro de tu proyecto.
2. Ejecutá la migración SQL en Supabase.
3. Verificá que RLS esté activo.
4. Asegurate de tener una función `getCurrentCompanyId()` o adaptá `lib/company.ts`.
5. Levantá el proyecto con `npm run dev`.

## Rutas
- `GET /api/company/conversations`
- `GET /api/company/conversations?conversationId=<uuid>`
- `POST /api/company/messages/send`

## Nota
La API de envío deja un hook listo para WhatsApp u otro canal. Por defecto guarda el mensaje saliente en base y devuelve éxito.
