import { NextRequest, NextResponse } from 'next/server';
import { deliverSubscription, getServiceSupabase } from '@/lib/report-delivery';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', nowIso)
      .order('next_run_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    const results = [] as Array<{ id: string; ok: boolean; error?: string }>;
    for (const subscription of data || []) {
      try {
        await deliverSubscription(supabase, subscription);
        results.push({ id: subscription.id, ok: true });
      } catch (error) {
        results.push({
          id: subscription.id,
          ok: false,
          error: error instanceof Error ? error.message : 'Unexpected error',
        });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
