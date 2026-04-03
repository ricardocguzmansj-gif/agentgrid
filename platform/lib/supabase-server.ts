import { createClient } from '@supabase/supabase-js'
import { sanitizeEnv } from './env'

export function getSupabaseServer() {
  const url = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)!
  const serviceKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)!
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
