# Digital Sun SaaS Factory

Proyecto comercial listo para deploy con **Next.js + Supabase + Cloudflare**, ahora extendido con:

- **Login y registro** con Supabase Auth.
- **Panel admin** con métricas comerciales.
- **Pricing y checkout real** con Stripe o Mercado Pago.
- **Métricas de ventas, MRR y comisiones** persistidas en Supabase.
- **Webhooks** para registrar pagos y atribuir afiliados.
- Landing premium, demo, automatización de leads y sistema de afiliados.

## Stack

- Next.js App Router
- Supabase (Postgres + Auth)
- Cloudflare + OpenNext
- Resend para emails
- Stripe o Mercado Pago para cobros

## Setup rápido

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Variables clave

- `ADMIN_EMAILS`: emails habilitados para `/admin`
- `CHECKOUT_PROVIDER`: `stripe` o `mercadopago`
- `STRIPE_*` o `MERCADOPAGO_*` según el proveedor

## Supabase

Ejecutá estas migraciones en orden:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_commerce_and_auth.sql`

## Flujo completo

1. El visitante entra a la landing o pricing.
2. Se guarda como lead y opcionalmente queda atribuido a un afiliado por `?ref=`.
3. Se lanza checkout real.
4. El webhook marca la orden como pagada.
5. El lead pasa a `won` y la comisión del afiliado se calcula automáticamente.
6. El admin ve todo en `/admin`, `/admin/leads`, `/admin/ventas` y `/admin/afiliados`.

## URLs principales

- `/` landing premium
- `/pricing` página de planes y checkout
- `/login` acceso a panel
- `/admin` dashboard comercial
- `/demo` demo de funcionamiento
- `/afiliados` alta de afiliados
- `/estrategia` estrategia a 1.000 clientes

## Notas importantes

- En producción, configurá los webhooks del proveedor de pago apuntando a:
  - `/api/webhooks/stripe`
  - `/api/webhooks/mercadopago`
- Si querés un panel de afiliados separado por usuario, la base ya está preparada para crecer hacia eso.
- El control de acceso admin hoy usa Supabase Auth + allowlist por `ADMIN_EMAILS` para salir rápido a vender.
