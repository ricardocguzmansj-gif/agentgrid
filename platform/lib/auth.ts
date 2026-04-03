import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';

function normalizeList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowed = normalizeList(process.env.ADMIN_EMAILS);
  
  // Fallback para asegurar acceso en producción si falla la env var
  const fallbackAdmins = ['ricardocguzman@gmail.com'];
  
  return allowed.includes(email.toLowerCase()) || fallbackAdmins.includes(email.toLowerCase());
}

export async function requireAdminUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login?next=/admin');
  }

  if (!isAdminEmail(user.email)) {
    redirect('/login?denied=1');
  }

  return user;
}
