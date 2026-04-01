'use client';

import { useEffect, useMemo, useState } from 'react';

type Subscription = {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  send_hour: number;
  weekday: number | null;
  day_of_month: number | null;
  is_active: boolean;
  next_run_at: string;
};

const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ReportSubscriptionsManager() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: 'Reporte ejecutivo',
    channel: 'email',
    recipient: '',
    frequency: 'weekly',
    send_hour: 9,
    weekday: 1,
    day_of_month: 1,
  });

  useEffect(() => {
    void loadItems();
  }, []);

  const helperText = useMemo(() => {
    if (form.frequency === 'daily') return 'Se enviará todos los días.';
    if (form.frequency === 'weekly') return `Se enviará cada ${weekdayLabels[Number(form.weekday)] || 'Lun'}.`;
    return `Se enviará el día ${form.day_of_month} de cada mes.`;
  }, [form.frequency, form.weekday, form.day_of_month]);

  async function loadItems() {
    setLoading(true);
    const res = await fetch('/api/company/report-subscriptions');
    const json = await res.json();
    setItems(json.items || []);
    setLoading(false);
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch('/api/company/report-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      alert(json.error || 'No se pudo crear la suscripción');
      return;
    }

    setForm({ ...form, recipient: '' });
    await loadItems();
  }

  async function toggleActive(item: Subscription) {
    const res = await fetch(`/api/company/report-subscriptions/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });

    if (!res.ok) {
      const json = await res.json();
      alert(json.error || 'No se pudo actualizar');
      return;
    }

    await loadItems();
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar esta suscripción?')) return;

    const res = await fetch(`/api/company/report-subscriptions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error || 'No se pudo eliminar');
      return;
    }

    await loadItems();
  }

  async function sendTest(subscriptionId: string) {
    setTestingId(subscriptionId);
    const res = await fetch('/api/company/reports/test-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subscriptionId }),
    });
    const json = await res.json();
    setTestingId(null);

    if (!res.ok) {
      alert(json.error || 'No se pudo enviar la prueba');
      return;
    }

    alert('Reporte de prueba enviado correctamente');
    await loadItems();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <form onSubmit={createItem} className="rounded-2xl border p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Nuevo reporte automático</h2>
        <p className="mt-1 text-sm text-neutral-600">Programá envíos diarios, semanales o mensuales.</p>

        <div className="mt-4 grid gap-3">
          <Field label="Nombre">
            <input className="w-full rounded-xl border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <Field label="Canal">
            <select className="w-full rounded-xl border px-3 py-2" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </Field>

          <Field label={form.channel === 'email' ? 'Email destino' : 'WhatsApp destino'}>
            <input className="w-full rounded-xl border px-3 py-2" placeholder={form.channel === 'email' ? 'cliente@empresa.com' : '549264xxxxxxx'} value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
          </Field>

          <Field label="Frecuencia">
            <select className="w-full rounded-xl border px-3 py-2" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </Field>

          {form.frequency === 'weekly' && (
            <Field label="Día de la semana">
              <select className="w-full rounded-xl border px-3 py-2" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
                {weekdayLabels.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
            </Field>
          )}

          {form.frequency === 'monthly' && (
            <Field label="Día del mes">
              <input type="number" min={1} max={28} className="w-full rounded-xl border px-3 py-2" value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: Number(e.target.value) })} />
            </Field>
          )}

          <Field label="Hora de envío (0-23)">
            <input type="number" min={0} max={23} className="w-full rounded-xl border px-3 py-2" value={form.send_hour} onChange={(e) => setForm({ ...form, send_hour: Number(e.target.value) })} />
          </Field>

          <p className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">{helperText}</p>

          <button disabled={submitting} className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60">
            {submitting ? 'Guardando...' : 'Guardar suscripción'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Suscripciones activas</h2>
            <p className="mt-1 text-sm text-neutral-600">Administrá quién recibe reportes y cuándo.</p>
          </div>
          <button onClick={() => void loadItems()} className="rounded-xl border px-3 py-2 text-sm">Actualizar</button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-neutral-600">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-600">Todavía no hay suscripciones.</p>
        ) : (
          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-neutral-600">{item.channel === 'email' ? 'Email' : 'WhatsApp'} · {item.recipient}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.frequency === 'daily' && 'Diario'}
                      {item.frequency === 'weekly' && `Semanal · ${weekdayLabels[item.weekday ?? 1]}`}
                      {item.frequency === 'monthly' && `Mensual · día ${item.day_of_month ?? 1}`}
                      {' · '}
                      {String(item.send_hour).padStart(2, '0')}:00
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Próximo envío: {new Date(item.next_run_at).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void toggleActive(item)} className="rounded-xl border px-3 py-2 text-sm">
                      {item.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => void sendTest(item.id)} disabled={testingId === item.id} className="rounded-xl bg-black px-3 py-2 text-sm text-white disabled:opacity-60">
                      {testingId === item.id ? 'Enviando...' : 'Enviar prueba'}
                    </button>
                    <button onClick={() => void deleteItem(item.id)} className="rounded-xl border px-3 py-2 text-sm text-red-600">
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
