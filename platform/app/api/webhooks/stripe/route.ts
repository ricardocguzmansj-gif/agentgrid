import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/plans';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'edge';

async function verifyStripeSignature(rawBody: string, signature: string | null) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) return true;
  
  const parts = Object.fromEntries(signature.split(',').map((part) => part.split('=')));
  const timestamp = parts.t;
  const stripeSignature = parts.v1;
  const signedPayload = `${timestamp}.${rawBody}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const hmacBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = Array.from(new Uint8Array(hmacBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === stripeSignature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!(await verifyStripeSignature(rawBody, signature))) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as any;
    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object;
    const metadata = session.metadata || {};
    const plan = getPlan(metadata.plan_id);
    const billingCycle = metadata.billing_cycle === 'annual' ? 'annual' : 'monthly';
    const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const affiliateCode = metadata.affiliate_code || null;
    const leadId = metadata.lead_id || null;
    const supabase = getSupabaseAdminClient();

    await supabase
      .from('orders')
      .update({
        status: 'paid',
        amount,
        billing_cycle: billingCycle,
        metadata: event,
      })
      .eq('provider', 'stripe')
      .eq('provider_checkout_id', session.id);

    if (leadId) {
      await supabase.from('leads').update({ status: 'won' }).eq('id', leadId);
    }

    if (affiliateCode && leadId) {
      const commissionRate = 0.30;
      await supabase
        .from('affiliate_referrals')
        .update({
          referral_status: 'won',
          commission_amount: Number((amount * commissionRate).toFixed(2)),
        })
        .eq('affiliate_code', affiliateCode)
        .eq('lead_id', leadId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Webhook Stripe falló.' }, { status: 400 });
  }
}
