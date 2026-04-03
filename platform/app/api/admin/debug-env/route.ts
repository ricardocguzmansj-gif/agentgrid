import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authClient = await getSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const debug = {
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) || 'none',
        suffix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring((process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0) - 5) || 'none',
        hasWhitespace: /\s/.test(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        prefix: process.env.OPENAI_API_KEY?.substring(0, 5) || 'none',
        hasWhitespace: /\s/.test(process.env.OPENAI_API_KEY || ''),
      },
      TURNSTILE_SECRET_KEY: {
        exists: !!process.env.TURNSTILE_SECRET_KEY,
        length: process.env.TURNSTILE_SECRET_KEY?.length || 0,
        prefix: process.env.TURNSTILE_SECRET_KEY?.substring(0, 5) || 'none',
        hasWhitespace: /\s/.test(process.env.TURNSTILE_SECRET_KEY || ''),
      },
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(debug);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
