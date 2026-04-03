import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { sanitizeEnv } from './env';

export async function getSupabaseServerClient() {
  const url = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const anonKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items: { name: string; value: string; options?: any }[]) => {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

export function getSupabaseAdminClient() {
  const url = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const serviceKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)!;
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
