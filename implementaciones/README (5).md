# Digital Sun SaaS Factory

Starter comercial listo para deploy con **Node + Next.js + Supabase + Cloudflare**.

Incluye:
- Landing premium de conversión.
- Guion y escenas del video de venta en `/demo`.
- Captura de leads con persistencia en Supabase.
- Validación anti-bot con Cloudflare Turnstile.
- Automatización de follow-ups por cron.
- Sistema de afiliados con tracking por `?ref=`.
- Hoja de ruta para llegar a 1.000 clientes.

## Arquitectura

- **Next.js App Router**: base full-stack en Node/React. Next.js documenta que puede desplegarse como servidor Node o mediante adaptadores; para Cloudflare se recomienda usar Workers con el adapter de OpenNext. citeturn755318search13turn755318search3turn755318search17
- **Supabase**: Postgres, Auth, APIs y RLS integradas. La propia documentación destaca Postgres + Auth + Realtime + Storage como bloques base. citeturn755318search4turn546978search7
- **Cloudflare Turnstile**: protección de formularios; la validación server-side con Siteverify es obligatoria. citeturn546978search1turn546978search23
- **Cloudflare Cron Triggers**: para ejecutar la automatización periódica de follow-ups. Cloudflare documenta cron triggers con `scheduled()` y pruebas con Wrangler. citeturn546978search0turn546978search12

## Estructura

```bash
app/
  page.tsx                 # landing principal
  demo/page.tsx            # demo comercial + video script
  afiliados/page.tsx       # alta de afiliados
  estrategia/page.tsx      # plan 1.000 clientes
  api/
    leads/route.ts         # captura de lead
    affiliates/route.ts    # registro afiliados
    cron/followups/route.ts# envíos automáticos
components/
lib/
supabase/migrations/
cloudflare/
```

## Requisitos

- Node 20+
- Cuenta de Supabase
- Cuenta de Cloudflare

## 1) Configurar Supabase

1. Crear proyecto en Supabase.
2. Ejecutar `supabase/migrations/001_init.sql` en el SQL Editor.
3. Copiar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2) Variables de entorno

```bash
cp .env.example .env.local
```

Completar las variables.

## 3) Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## 4) Deploy en Cloudflare

1. Instalar Wrangler y autenticarte.
2. Configurar `wrangler.toml`.
3. Publicar el sitio:

```bash
npm run cf:deploy
```

Para el cron, desplegar el worker separado:

```bash
npx wrangler deploy -c cloudflare/wrangler.cron.toml --var SITE_URL:https://tu-dominio.com --var CRON_SECRET:tu_secreto
```

## 5) Turnstile

Turnstile puede incrustarse en cualquier sitio y no requiere pasar el tráfico por el CDN de Cloudflare; aun así, el token debe validarse en servidor con Siteverify. citeturn546978search9turn546978search1

- Cargar `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Cargar `TURNSTILE_SECRET_KEY`

## 6) Cómo funciona el embudo

1. Un visitante llega a la landing.
2. Si entra con `?ref=partner-x`, el middleware guarda una cookie con el afiliado.
3. El formulario crea un lead en Supabase.
4. Se programan follow-ups en `lead_events`.
5. El cron invoca `/api/cron/followups`.
6. Se envían correos con Resend si `RESEND_API_KEY` existe; si no, se simula el envío.

## 7) Qué te conviene agregar en la siguiente iteración

- Checkout con Stripe o Mercado Pago.
- Panel autenticado para afiliados.
- Dashboard comercial con métricas.
- Integración con WhatsApp API.
- CRM de demos, propuestas y cierres.
