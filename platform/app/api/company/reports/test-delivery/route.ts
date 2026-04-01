import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, deliverSubscription } from '@/lib/report-delivery';
import { getCurrentCompanyIdOrThrow } from '@/lib/company';


export async function POST(request: NextRequest) {
  try {
    const companyId = await getCurrentCompanyIdOrThrow();
    const { subscription_id } = await request.json();

    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('company_id', companyId)
      .single();

    if (error) throw error;

    const result = await deliverSubscription(supabase, data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
