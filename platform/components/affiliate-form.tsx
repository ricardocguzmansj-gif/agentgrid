'use client';

import { useState } from 'react';

export function AffiliateForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar afiliado');
      setResponse(`Tu enlace quedó listo: ${data.referralUrl}`);
      setName('');
      setEmail('');
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <button className="button-primary mt-5 w-full" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta de afiliado'}
      </button>
      {response ? <p className="mt-4 text-sm text-cyan-200">{response}</p> : null}
    </form>
  );
}
