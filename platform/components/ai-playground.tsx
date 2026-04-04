'use client';

import { useEffect, useState, useRef } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export function AIPlayground({ companyId, agents, brandName, primaryColor, accentColor }: { companyId: string; agents: { id: string; name: string }[]; brandName?: string; primaryColor?: string; accentColor?: string }) {
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAgentId(agents[0]?.id || '');
  }, [companyId, agents]);

  useEffect(() => {
    // scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setLoading(true);
    
    // Add user message optimistically
    const currentDraft = draft;
    const currentHistory = [...messages];
    setMessages([...currentHistory, { role: 'user', content: currentDraft }]);
    setDraft('');

    try {
      const res = await fetch('/api/ai/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, agentId, message: currentDraft, history: currentHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ejecutar la IA');
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.output }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: error instanceof Error ? error.message : 'Error inesperado' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveEdit(index: number) {
    const updated = [...messages];
    updated[index].content = editContent;
    setMessages(updated);
    setEditingIndex(null);
  }

  async function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    alert('Texto copiado al portapapeles');
  }

  async function handleSaveToCRM(text: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/company/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          title: `Oportunidad generada por IA`,
          value: 0,
          stage: 'lead',
        }),
      });
      if (res.ok) {
        alert('Oportunidad generada exitosamente en el Pipeline del CRM.');
      } else {
        const errorData = await res.json();
        alert('Error al guardar en el CRM: ' + (errorData.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error inesperado al conectar con el CRM.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendWA(text: string) {
    if (!waPhone) {
      alert('Ingresá el número de teléfono (ej: 54911...).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, to: waPhone, body: text }),
      });
      if (res.ok) {
        alert('¡Mensaje enviado exitosamente a WhatsApp!');
        setShowWaInput(false);
      } else {
        const errorData = await res.json();
        alert('Error al enviar WhatsApp: ' + (errorData.error || 'Verificá tu canal configurado.'));
      }
    } catch (e) {
      alert('Error inesperado al conectar con WhatsApp API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 flex flex-col max-h-[85vh]" style={{ borderColor: `${primaryColor || '#22d3ee'}44` }}>
      <div>
        <p className="text-sm uppercase tracking-[0.2em]" style={{ color: primaryColor || '#22d3ee' }}>IA real</p>
        <h3 className="mt-2 text-2xl font-semibold">Playground de {brandName || 'la empresa'}</h3>
        
        <div className="mt-4 flex flex-col md:flex-row gap-4 mb-4">
          <select className="flex-1 rounded-2xl border border-white/10 bg-ink px-4 py-3 text-sm" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
          </select>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 transition">Nuevo Chat</button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-2 py-2 min-h-64 border-y border-white/10 my-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-center">
            <p>El chat está vacío.</p>
            <p className="text-sm mt-2">Enviá un mensaje para empezar a generar propuestas, flujos o ideas con IA.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-black/30 text-white/90 border border-white/5'}`}>
                {msg.role === 'user' && <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Tú</p>}
                {msg.role === 'assistant' && <p className="text-xs uppercase tracking-widest text-[#22d3ee] mb-2">IA</p>}
                
                {editingIndex === idx ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <textarea 
                      className="w-full bg-ink border border-white/20 rounded-xl p-3 min-h-48 text-white focus:outline-none focus:border-[#22d3ee]/50"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingIndex(null)} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/60 hover:text-white transition">Cancelar</button>
                      <button onClick={() => handleSaveEdit(idx)} className="text-xs px-3 py-1.5 rounded-lg bg-[#22d3ee]/20 text-[#22d3ee] hover:bg-[#22d3ee]/30 transition">Guardar cambios</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button onClick={() => { setEditingIndex(idx); setEditContent(msg.content); }} className="mt-3 text-xs text-[#22d3ee]/60 hover:text-[#22d3ee] transition uppercase tracking-widest">
                        Editar Texto
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Botones de accion solo en el ultimo mensaje del assistant si no esta en edicion */}
              {msg.role === 'assistant' && idx === messages.length - 1 && editingIndex !== idx && (
                <div className="mt-3 ml-2 flex flex-col items-start w-full">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleCopy(msg.content)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10" disabled={loading}>
                      Copiar
                    </button>
                    <button onClick={() => handleSaveToCRM(msg.content)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10" disabled={loading}>
                      Llevar al CRM
                    </button>
                    <button onClick={() => setShowWaInput(!showWaInput)} className="rounded-full px-3 py-1.5 text-xs text-white transition" style={{ background: `${primaryColor || '#22d3ee'}22`, color: primaryColor || '#22d3ee' }} disabled={loading}>
                      Probar en WhatsApp
                    </button>
                  </div>
                  
                  {showWaInput && (
                    <div className="mt-3 flex gap-2 w-full max-w-sm">
                      <input className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm" placeholder="Número (ej: 54911...)" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
                      <button onClick={() => handleSendWA(msg.content)} className="rounded-xl px-3 py-1.5 text-sm font-medium transition" style={{ background: primaryColor || '#22d3ee', color: '#000' }} disabled={loading}>
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start">
            <div className="max-w-[80%] rounded-2xl p-4 bg-black/30 border border-white/5">
               <p className="text-xs uppercase tracking-widest text-[#22d3ee] mb-2 animate-pulse">IA Escribiendo...</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea 
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 max-h-32 min-h-12 resize-y focus:outline-none focus:border-cyan-500/50" 
          placeholder="Escribile al agente para continuar el flujo..."
          value={draft} 
          onChange={(e) => setDraft(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={loading}
        />
        <button 
          className="rounded-2xl p-4 transition shrink-0" 
          style={{ background: `linear-gradient(135deg, ${primaryColor || '#22d3ee'}, ${accentColor || '#8b5cf6'})`, color: '#000' }} 
          disabled={loading || !draft.trim()}
          type="submit"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
}
