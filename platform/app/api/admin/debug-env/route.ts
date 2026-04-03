import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';
import { sanitizeEnv } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const authClient = await getSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const rawSBRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cleanSBRole = sanitizeEnv(rawSBRole);

    const debug = {
      SUPABASE_SERVICE_ROLE_KEY: {
        raw_exists: !!rawSBRole,
        raw_length: rawSBRole?.length || 0,
        raw_prefix: rawSBRole?.substring(0, 5) || 'none',
        clean_exists: !!cleanSBRole,
        clean_length: cleanSBRole?.length || 0,
        clean_prefix: cleanSBRole?.substring(0, 5) || 'none',
        hasBOM: rawSBRole?.startsWith('\uFEFF'),
        hasWhitespace: /\s/.test(rawSBRole || ''),
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        prefix: process.env.OPENAI_API_KEY?.substring(0, 5) || 'none',
        sanitized_prefix: sanitizeEnv(process.env.OPENAI_API_KEY)?.substring(0, 5) || 'none',
      },
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(debug);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
