'use client';

import { useState } from 'react';

export function AutomationForm({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [name, setName] = useState(`Digest diario - ${companyName}`);
  const [channelType, setChannelType] = useState<'email' | 'whatsapp'>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('Generá un resumen ejecutivo breve con leads nuevos, ventas y recomendaciones comerciales para hoy.');
  const [scheduleCron, setScheduleCron] = useState('0 12 * * *');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, name, channelType, targetEmail, targetPhone, promptTemplate, scheduleCron }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la automatización');
      setMessage('Automatización creada y lista para correr por Cloudflare cron.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Automatización</p>
        <h3 className="mt-2 text-xl font-semibold">Crear flujo para {companyName}</h3>
      </div>
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="grid gap-4 md:grid-cols-2">
        <select className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" value={channelType} onChange={(e) => setChannelType(e.target.value as 'email' | 'whatsapp')}>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Cron (UTC) ej 0 12 * * *" value={scheduleCron} onChange={(e) => setScheduleCron(e.target.value)} required />
      </div>
      {channelType === 'email' ? (
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="email" placeholder="Email destino" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
      ) : (
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Número destino ej 549264..." value={targetPhone} onChange={(e) => setTargetPhone(e.target.value)} />
      )}
      <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} required />
      <button className="button-secondary w-full" disabled={loading}>{loading ? 'Guardando...' : 'Guardar automatización'}</button>
      {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
    </form>
  );
}
