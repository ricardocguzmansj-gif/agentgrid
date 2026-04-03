'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/browser-supabase';

export function AuthForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(next as any);
        router.refresh();
      } else {
        const redirectTo = `${window.location.origin}/login?registered=1`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setMessage('Cuenta creada. Revisá tu email para confirmar el acceso si tu proyecto tiene verificación activada.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 text-sm">
        <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-xl px-4 py-2 ${mode === 'login' ? 'bg-white text-ink' : 'text-white/70'}`}>
          Ingresar
        </button>
        <button type="button" onClick={() => setMode('signup')} className={`flex-1 rounded-xl px-4 py-2 ${mode === 'signup' ? 'bg-white text-ink' : 'text-white/70'}`}>
          Crear cuenta
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input autoComplete="username" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Email corporativo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input autoComplete="current-password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="button-primary w-full disabled:opacity-70" disabled={loading}>
          {loading ? 'Procesando...' : mode === 'login' ? 'Entrar al panel' : 'Crear cuenta'}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm text-white/60">
        <span>Panel protegido con Supabase Auth</span>
        <button type="button" onClick={signOut} className="underline underline-offset-4">Cerrar sesión</button>
      </div>
      {searchParams.get('denied') ? <p className="mt-4 text-sm text-amber-300">Tu cuenta existe, pero tu email no está en ADMIN_EMAILS.</p> : null}
      {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
    </div>
  );
}
