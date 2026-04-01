import { NextRequest, NextResponse } from 'next/server';
import { getPlan } from '@/lib/plans';
import { getSupabaseAdminClient } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
    const resourceId = body?.data?.id || body?.id;
    if (!resourceId || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({ ok: true });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    });
    const payment = await paymentRes.json() as any;
    if (!paymentRes.ok) {
      return NextResponse.json({ error: 'No se pudo validar el pago.' }, { status: 400 });
    }

    const metadata = payment.metadata || {};
    const plan = getPlan(metadata.plan_id);
    const billingCycle = metadata.billing_cycle === 'annual' ? 'annual' : 'monthly';
    const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const affiliateCode = metadata.affiliate_code || null;
    const leadId = metadata.lead_id || null;
    const status = payment.status === 'approved' ? 'paid' : payment.status;
    const supabase = getSupabaseAdminClient();

    await supabase
      .from('orders')
      .update({
        status,
        amount,
        metadata: payment,
      })
      .eq('provider', 'mercadopago')
      .eq('provider_checkout_id', payment.order?.id || payment.external_reference || payment.id);

    if (status === 'paid' && leadId) {
      await supabase.from('leads').update({ status: 'won' }).eq('id', leadId);
    }

    if (status === 'paid' && affiliateCode && leadId) {
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
    return NextResponse.json({ error: 'Webhook Mercado Pago falló.' }, { status: 400 });
  }
}
