'use client';

import { useEffect, useState } from 'react';

export function AIPlayground({ companyId, agents, brandName, primaryColor, accentColor }: { companyId: string; agents: { id: string; name: string }[]; brandName?: string; primaryColor?: string; accentColor?: string }) {
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [message, setMessage] = useState('Generá una propuesta comercial para una pyme que quiere automatizar WhatsApp y seguimiento de leads.');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAgentId(agents[0]?.id || '');
  }, [companyId, agents]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/ai/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, agentId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ejecutar la IA');
      setResponse(data.output);
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6" style={{ borderColor: `${primaryColor || '#22d3ee'}44` }}>
      <div>
        <p className="text-sm uppercase tracking-[0.2em]" style={{ color: primaryColor || '#22d3ee' }}>IA real</p>
        <h3 className="mt-2 text-2xl font-semibold">Playground de {brandName || 'la empresa'}</h3>
        <p className="mt-2 text-sm text-white/60">Probá agentes reales, por nicho, con branding y flujos listos para WhatsApp.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <select className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </select>
        <textarea className="min-h-36 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={message} onChange={(e) => setMessage(e.target.value)} required />
        <button className="button-primary w-full" style={{ background: `linear-gradient(135deg, ${primaryColor || '#22d3ee'}, ${accentColor || '#8b5cf6'})` }} disabled={loading}>{loading ? 'Consultando OpenAI...' : 'Ejecutar IA'}</button>
      </form>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80 whitespace-pre-wrap min-h-32">
        {response || 'La respuesta del agente aparecerá acá.'}
      </div>
    </div>
  );
}
