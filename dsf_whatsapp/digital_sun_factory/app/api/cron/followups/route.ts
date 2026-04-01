import { NextRequest, NextResponse } from 'next/server';
import { buildLeadFollowupEmail, sendEmail } from '@/lib/mailer';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: events, error } = await supabase
      .from('lead_events')
      .select('id, event_type, lead_id, payload, leads(first_name, email)')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (error) throw error;

    const processed: string[] = [];

    for (const event of events ?? []) {
      const lead = Array.isArray(event.leads) ? event.leads[0] : event.leads;
      if (!lead?.email) continue;
      const email = buildLeadFollowupEmail(lead.first_name || 'Hola');
      await sendEmail(lead.email, email.subject, email.html);
      await supabase.from('lead_events').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', event.id);
      processed.push(event.id);
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
