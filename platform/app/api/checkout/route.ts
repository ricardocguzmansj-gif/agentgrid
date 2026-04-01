import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/checkout';
import { getPlan } from '@/lib/plans';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'edge';

const schema = z.object({
  planId: z.enum(['starter', 'pro', 'scale']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  email: z.string().email(),
  leadId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const affiliateCode = request.cookies.get('ds_ref')?.value ?? null;
    const checkout = await createCheckoutSession({ ...payload, affiliateCode });
    const plan = getPlan(payload.planId);
    const amount = payload.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.from('orders').insert({
      provider: checkout.provider,
      provider_checkout_id: checkout.externalId,
      customer_email: payload.email,
      plan_id: payload.planId,
      billing_cycle: payload.billingCycle,
      amount,
      currency: process.env.DEFAULT_CURRENCY || 'usd',
      status: 'pending',
      lead_id: payload.leadId,
      affiliate_code: affiliateCode,
      metadata: { initiated_from: 'pricing' },
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo iniciar el checkout.' }, { status: 400 });
  }
}
