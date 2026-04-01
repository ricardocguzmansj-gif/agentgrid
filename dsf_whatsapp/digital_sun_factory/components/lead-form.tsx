'use client';

import { useState } from 'react';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  whatsapp: string;
  goal: string;
};

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  whatsapp: '',
  goal: '',
};

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string | HTMLElement, options: Record<string, unknown>) => void;
      getResponse: () => string;
    };
  }
}

export function LeadForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const turnstileToken = typeof window !== 'undefined' && window.turnstile ? window.turnstile.getResponse() : null;
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar el lead');
      }
      window.localStorage.setItem('digitalsun_last_lead_id', data.leadId);
      setMessage('¡Listo! Tu lead quedó registrado y la secuencia comercial fue programada.');
      setForm(initialState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <textarea className="min-h-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2" placeholder="¿Qué querés automatizar?" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required />
      </div>
      <div className="mt-5 space-y-4">
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/60">
            Agregá tu widget de Cloudflare Turnstile usando la site key pública. El backend ya valida el token.
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/60">
            Turnstile está desactivado en local. Cargá NEXT_PUBLIC_TURNSTILE_SITE_KEY y TURNSTILE_SECRET_KEY para activarlo.
          </div>
        )}
        <button className="button-primary w-full disabled:opacity-70" type="submit" disabled={loading}>
          {loading ? 'Guardando lead...' : 'Solicitar demo gratis'}
        </button>
        {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
      </div>
    </form>
  );
}
