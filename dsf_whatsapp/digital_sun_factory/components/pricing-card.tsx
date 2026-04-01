'use client';

import { useState } from 'react';
import type { Plan } from '@/lib/plans';

type Props = {
  plan: Plan;
};

export function PricingCard({ plan }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  async function startCheckout() {
    setLoading(true);
    setMessage(null);
    try {
      const emailInput = window.prompt('Ingresá el email del cliente o del comprador para iniciar el checkout:');
      if (!emailInput) {
        setLoading(false);
        return;
      }
      const leadId = window.localStorage.getItem('digitalsun_last_lead_id');
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, billingCycle, email: emailInput, leadId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el checkout.');
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card flex h-full flex-col p-6 ${plan.highlight ? 'border-cyan-300/40 bg-cyan-400/10' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <p className="mt-2 text-white/70">{plan.description}</p>
        </div>
        {plan.highlight ? <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Más elegido</span> : null}
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-white/60">
        <button type="button" onClick={() => setBillingCycle('monthly')} className={`rounded-full px-3 py-1 ${billingCycle === 'monthly' ? 'bg-white text-ink' : 'border border-white/10'}`}>Mensual</button>
        <button type="button" onClick={() => setBillingCycle('annual')} className={`rounded-full px-3 py-1 ${billingCycle === 'annual' ? 'bg-white text-ink' : 'border border-white/10'}`}>Anual</button>
      </div>
      <p className="mt-6 text-4xl font-semibold">
        USD {billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
        <span className="text-base font-normal text-white/50">/{billingCycle === 'monthly' ? 'mes' : 'año'}</span>
      </p>
      <ul className="mt-6 space-y-3 text-white/75">
        {plan.features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <button type="button" onClick={startCheckout} disabled={loading} className="button-primary mt-8 w-full disabled:opacity-70">
        {loading ? 'Conectando checkout...' : plan.cta}
      </button>
      {message ? <p className="mt-3 text-sm text-amber-300">{message}</p> : null}
    </div>
  );
}
