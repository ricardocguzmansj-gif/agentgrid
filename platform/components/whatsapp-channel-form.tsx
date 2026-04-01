'use client';

import { useState } from 'react';

export function WhatsAppChannelForm({ companyId }: { companyId: string }) {
  const [provider, setProvider] = useState('meta');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testBody, setTestBody] = useState('Hola, este es un mensaje de prueba desde Digital Sun SaaS Factory.');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveChannel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/whatsapp-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, provider, phoneNumberId, accessToken, fromNumber, twilioAccountSid: twilioSid, twilioAuthToken: twilioToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el canal');
      setMessage('Canal WhatsApp guardado correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, to: testPhone, body: testBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el test');
      setMessage('Mensaje de prueba enviado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={saveChannel} className="card p-6 space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">WhatsApp real</p>
        <h3 className="mt-2 text-xl font-semibold">Canal por empresa</h3>
        <p className="mt-2 text-sm text-white/60">Podés usar Meta WhatsApp Cloud API o Twilio. Las credenciales se guardan por empresa.</p>
      </div>
      <select className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="meta">Meta Cloud API</option>
        <option value="twilio">Twilio WhatsApp</option>
      </select>
      {provider === 'meta' ? (
        <>
          <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Phone Number ID" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
          <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Access Token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
        </>
      ) : (
        <>
          <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Twilio Account SID" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} />
          <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Twilio Auth Token" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} />
          <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Número origen, ej whatsapp:+14155238886" value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
        </>
      )}
      <button className="button-secondary w-full" disabled={loading}>{loading ? 'Guardando...' : 'Guardar canal'}</button>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
        <p className="text-sm font-medium">Enviar prueba</p>
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="54911..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
        <textarea className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={testBody} onChange={(e) => setTestBody(e.target.value)} />
        <button type="button" className="button-primary w-full" onClick={sendTest} disabled={loading}>Enviar test por WhatsApp</button>
      </div>
      {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
    </form>
  );
}
