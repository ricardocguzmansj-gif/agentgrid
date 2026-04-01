import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, calculateNextRunAt } from '@/lib/report-delivery';
import { getCurrentCompanyIdOrThrow } from '@/lib/company';


type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const companyId = await getCurrentCompanyIdOrThrow();
    const body = await request.json();
    const supabase = getServiceSupabase();

    const patch: Record<string, unknown> = {};
    for (const field of ['name', 'recipient', 'timezone', 'filters']) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    for (const field of ['channel', 'frequency']) {
      if (body[field] !== undefined) patch[field] = String(body[field]);
    }
    for (const field of ['send_hour', 'weekday', 'day_of_month']) {
      if (body[field] !== undefined) patch[field] = body[field] == null ? null : Number(body[field]);
    }
    if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

    const scheduleBase = {
      frequency: String(patch.frequency ?? body.frequency ?? 'weekly') as 'daily' | 'weekly' | 'monthly',
      send_hour: Number(patch.send_hour ?? body.send_hour ?? 9),
      weekday: patch.weekday == null ? null : Number(patch.weekday),
      day_of_month: patch.day_of_month == null ? null : Number(patch.day_of_month),
      timezone: String(patch.timezone ?? body.timezone ?? 'America/Argentina/San_Juan'),
    };

    patch.next_run_at = calculateNextRunAt(scheduleBase).toISOString();

    const { data, error } = await supabase
      .from('report_subscriptions')
      .update(patch)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const companyId = await getCurrentCompanyIdOrThrow();
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('report_subscriptions')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
