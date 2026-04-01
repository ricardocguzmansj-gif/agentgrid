import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, calculateNextRunAt } from '@/lib/report-delivery';
import { getCurrentCompanyIdOrThrow } from '@/lib/company';

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await getCurrentCompanyIdOrThrow();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const record = {
      company_id: companyId,
      name: String(body.name || 'Reporte ejecutivo'),
      channel: body.channel === 'whatsapp' ? 'whatsapp' : 'email',
      recipient: String(body.recipient || '').trim(),
      frequency: ['daily', 'weekly', 'monthly'].includes(body.frequency) ? body.frequency : 'weekly',
      report_type: 'executive_summary',
      timezone: String(body.timezone || 'America/Argentina/San_Juan'),
      send_hour: Number(body.send_hour ?? 9),
      weekday: body.weekday == null ? null : Number(body.weekday),
      day_of_month: body.day_of_month == null ? null : Number(body.day_of_month),
      is_active: Boolean(body.is_active ?? true),
      filters: body.filters && typeof body.filters === 'object' ? body.filters : {},
    };

    if (!record.recipient) {
      return NextResponse.json({ error: 'recipient is required' }, { status: 400 });
    }

    const nextRunAt = calculateNextRunAt(record as never);

    const { data, error } = await supabase
      .from('report_subscriptions')
      .insert({ ...record, next_run_at: nextRunAt.toISOString() })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
