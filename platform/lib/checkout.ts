import { getPlan, type PlanId } from '@/lib/plans';

export type CheckoutPayload = {
  planId: PlanId;
  billingCycle?: 'monthly' | 'annual';
  email: string;
  leadId?: string | null;
  affiliateCode?: string | null;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:3000';
}

function getStripePriceId(planId: PlanId, billingCycle: 'monthly' | 'annual') {
  const key = billingCycle === 'annual'
    ? `STRIPE_PRICE_${planId.toUpperCase()}_ANNUAL`
    : `STRIPE_PRICE_${planId.toUpperCase()}`;
  return process.env[key];
}

export async function createStripeCheckout(payload: CheckoutPayload) {
  const plan = getPlan(payload.planId);
  const priceId = getStripePriceId(payload.planId, payload.billingCycle || 'monthly');
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    throw new Error('Faltan STRIPE_SECRET_KEY o price IDs.');
  }

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${getBaseUrl()}/pricing?cancelled=1`);
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('customer_email', payload.email);
  params.set('metadata[plan_id]', payload.planId);
  params.set('metadata[billing_cycle]', payload.billingCycle || 'monthly');
  params.set('metadata[lead_id]', payload.leadId || '');
  params.set('metadata[affiliate_code]', payload.affiliateCode || '');
  params.set('metadata[plan_name]', plan.name);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !data.url) {
    throw new Error(data.error?.message || 'No se pudo crear la sesión de Stripe.');
  }

  return { provider: 'stripe', checkoutUrl: data.url, externalId: data.id };
}

export async function createMercadoPagoCheckout(payload: CheckoutPayload) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN.');
  }

  const plan = getPlan(payload.planId);
  const billingCycle = payload.billingCycle || 'monthly';
  const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const titleMap = {
    starter: process.env.MERCADOPAGO_PLAN_STARTER_TITLE || 'Digital Sun Starter',
    pro: process.env.MERCADOPAGO_PLAN_PRO_TITLE || 'Digital Sun Pro',
    scale: process.env.MERCADOPAGO_PLAN_SCALE_TITLE || 'Digital Sun Scale',
  } as const;

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: titleMap[payload.planId],
          quantity: 1,
          currency_id: (process.env.DEFAULT_CURRENCY || 'USD').toUpperCase(),
          unit_price: amount,
        },
      ],
      payer: { email: payload.email },
      back_urls: {
        success: `${getBaseUrl()}/checkout/success`,
        failure: `${getBaseUrl()}/pricing?cancelled=1`,
        pending: `${getBaseUrl()}/pricing?pending=1`,
      },
      auto_return: 'approved',
      external_reference: payload.leadId || payload.email,
      metadata: {
        plan_id: payload.planId,
        billing_cycle: billingCycle,
        lead_id: payload.leadId || null,
        affiliate_code: payload.affiliateCode || null,
      },
      notification_url: `${getBaseUrl()}/api/webhooks/mercadopago`,
    }),
  });

  const data = await response.json() as { id?: string; init_point?: string; sandbox_init_point?: string; message?: string };
  const url = data.init_point || data.sandbox_init_point;
  if (!response.ok || !url) {
    throw new Error(data.message || 'No se pudo crear la preferencia de Mercado Pago.');
  }

  return { provider: 'mercadopago', checkoutUrl: url, externalId: data.id };
}

export async function createCheckoutSession(payload: CheckoutPayload) {
  const provider = (process.env.CHECKOUT_PROVIDER || 'stripe').toLowerCase();
  if (provider === 'mercadopago') {
    return createMercadoPagoCheckout(payload);
  }
  return createStripeCheckout(payload);
}
