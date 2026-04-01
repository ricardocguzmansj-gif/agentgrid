import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Browser-side Supabase client (singleton).
 * Used by client components for realtime subscriptions and auth state.
 */
export function getSupabaseBrowser() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}
