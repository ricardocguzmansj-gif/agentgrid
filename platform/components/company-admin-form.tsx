'use client';

import { useState } from 'react';
import { INDUSTRY_OPTIONS } from '@/lib/agent-templates';

export function CompanyAdminForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('starter');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [industry, setIndustry] = useState('general');
  const [brandName, setBrandName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#22d3ee');
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const sanitizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          slug: sanitizedSlug, 
          plan, 
          ownerEmail: ownerEmail.trim() || undefined, 
          industry, 
          brandName: brandName.trim() || undefined, 
          primaryColor, 
          accentColor, 
          supportEmail: supportEmail.trim() || undefined, 
          supportPhone: supportPhone.trim() || undefined 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la empresa');
      setMessage(`Empresa creada: ${data.company.name}. Se generaron agentes por nicho automáticamente.`);
      setName('');
      setSlug('');
      setPlan('starter');
      setOwnerEmail('');
      setBrandName('');
      setSupportEmail('');
      setSupportPhone('');
      setIndustry('general');
      setPrimaryColor('#22d3ee');
      setAccentColor('#8b5cf6');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Admin general</p>
        <h3 className="mt-2 text-2xl font-semibold">Crear nueva empresa</h3>
        <p className="mt-2 text-sm text-white/60">Además del tenant, se crea branding base y un paquete de agentes por industria.</p>
      </div>
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre comercial" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="slug-empresa" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Nombre de marca visible (opcional)" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
      <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Email del owner inicial" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
      <div className="grid gap-4 md:grid-cols-2">
        <select className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="scale">Scale</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          {INDUSTRY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">Color principal
          <input className="mt-2 h-10 w-full" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </label>
        <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">Color acento
          <input className="mt-2 h-10 w-full" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Email soporte" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="WhatsApp soporte" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
      </div>
      <button className="button-primary w-full" disabled={loading}>{loading ? 'Creando...' : 'Crear empresa + agentes + branding'}</button>
      {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
    </form>
  );
}
