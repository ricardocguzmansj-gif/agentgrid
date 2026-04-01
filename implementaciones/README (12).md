# Digital Sun Factory — CRM Pipeline Avanzado

Este módulo agrega a tu CRM conversacional:
- asignación de conversaciones a operadores
- etiquetas por conversación
- notas internas
- oportunidades comerciales
- embudo de ventas por etapas
- vista visual tipo CRM dentro de `/portal/conversations`

## Qué copiar al proyecto principal
Copiá estas carpetas dentro de tu proyecto Next.js + Supabase:
- `app/api/company/...`
- `app/portal/conversations/page.tsx`
- `components/advanced-conversations-crm.tsx`
- `lib/crm-types.ts`
- `supabase/migrations/007_crm_pipeline.sql`

## Requisitos previos
Este módulo asume que ya tenés:
- tabla `company_memberships`
- tablas `conversations` y `messages`
- helper `getCurrentCompanyId()`
- helper `getSupabaseServer()`
- helper `getSupabaseBrowser()`

## Instalación
1. Ejecutá `007_crm_pipeline.sql` en Supabase.
2. Copiá los archivos del módulo al proyecto principal.
3. Reiniciá el servidor `npm run dev`.
4. Entrá a `/portal/conversations`.

## Qué vas a poder hacer
- asignar una conversación a un operador
- agregar o quitar etiquetas
- guardar notas internas
- crear una oportunidad comercial
- moverla entre etapas del embudo
- ver el valor total del pipeline
