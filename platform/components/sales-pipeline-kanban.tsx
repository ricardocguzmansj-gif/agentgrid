'use client'

import { useEffect, useMemo, useState } from 'react'

type Stage = {
  key: string
  label: string
  probability: number
}

type Opportunity = {
  id: string
  title: string
  contact_name: string | null
  company_name: string | null
  amount: number
  stage: string
  probability: number
  expected_close_date: string | null
  owner_user_id: string | null
  owner_name?: string | null
  updated_at?: string
}

type ForecastSummary = {
  total_open_amount: number
  weighted_forecast_amount: number
  by_stage: Array<{ stage: string; amount: number; weighted_amount: number; count: number }>
  by_owner: Array<{ owner_user_id: string | null; owner_name: string | null; amount: number; weighted_amount: number; count: number }>
}

const STAGES: Stage[] = [
  { key: 'new', label: 'Nuevo', probability: 10 },
  { key: 'qualified', label: 'Calificado', probability: 25 },
  { key: 'proposal', label: 'Propuesta', probability: 50 },
  { key: 'negotiation', label: 'Negociación', probability: 75 },
  { key: 'won', label: 'Ganado', probability: 100 },
  { key: 'lost', label: 'Perdido', probability: 0 },
]

function currency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

export default function SalesPipelineKanban() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [forecast, setForecast] = useState<ForecastSummary | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [kanbanRes, forecastRes] = await Promise.all([
        fetch('/api/company/opportunities/kanban', { cache: 'no-store' }),
        fetch('/api/company/opportunities/forecast', { cache: 'no-store' }),
      ])
      if (!kanbanRes.ok) throw new Error('No se pudo cargar el pipeline')
      if (!forecastRes.ok) throw new Error('No se pudo cargar el forecast')
      const kanbanJson = await kanbanRes.json()
      const forecastJson = await forecastRes.json()
      setItems(kanbanJson.items || [])
      setForecast(forecastJson)
    } catch (e: any) {
      setError(e?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, Opportunity[]> = {}
    for (const stage of STAGES) map[stage.key] = []
    for (const item of items) {
      if (!map[item.stage]) map[item.stage] = []
      map[item.stage].push(item)
    }
    return map
  }, [items])

  async function moveOpportunity(id: string, stage: string) {
    const prev = items
    setItems((curr) => curr.map((it) => (it.id === id ? { ...it, stage, probability: STAGES.find((s) => s.key === stage)?.probability ?? it.probability } : it)))
    try {
      const res = await fetch(`/api/company/opportunities/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) throw new Error('No se pudo mover la oportunidad')
      await loadAll()
    } catch (e: any) {
      setItems(prev)
      setError(e?.message || 'Error al mover oportunidad')
    }
  }

  if (loading) return <div className="p-6 text-sm">Cargando pipeline...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tablero Kanban</h2>
          <p className="text-sm text-cyan-200/70">Arrastra para avanzar las etapas de venta en tu pipeline.</p>
        </div>
        <button onClick={() => void loadAll()} className="button-secondary text-sm">Actualizar</button>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs uppercase text-white/50">Pipeline abierto</div>
          <div className="mt-2 text-2xl font-bold text-white">{currency(forecast?.total_open_amount || 0)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs uppercase text-white/50">Forecast ponderado</div>
          <div className="mt-2 text-2xl font-bold text-white">{currency(forecast?.weighted_forecast_amount || 0)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs uppercase text-white/50">Oportunidades</div>
          <div className="mt-2 text-2xl font-bold text-white">{items.filter(i => i.stage !== 'won' && i.stage !== 'lost').length}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6 lg:grid-cols-3 md:grid-cols-2">
        {STAGES.map((stage) => {
          const stageItems = grouped[stage.key] || []
          const total = stageItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
          return (
            <section
              key={stage.key}
              className="min-h-[420px] rounded-2xl border border-white/5 bg-white/5 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (draggingId) void moveOpportunity(draggingId, stage.key)
                setDraggingId(null)
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white/90">{stage.label}</h2>
                  <div className="text-xs text-white/50">{stageItems.length} ops · {currency(total)}</div>
                </div>
                <div className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2 py-1 text-xs text-cyan-200">{stage.probability}%</div>
              </div>

              <div className="space-y-3">
                {stageItems.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="cursor-grab rounded-2xl border border-white/10 bg-black/40 p-3 shadow-sm hover:border-cyan-400/50 transition active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight text-white">{item.title}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">{item.probability}%</span>
                    </div>
                    <div className="mt-2 text-sm text-white/60">{item.company_name || 'Sin empresa'} · {item.contact_name || 'Sin contacto'}</div>
                    <div className="mt-3 text-lg font-semibold text-white/90">{currency(Number(item.amount) || 0)}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/50">
                      <span className="rounded-full border border-white/10 bg-black/50 px-2 py-1">Vendedor: {item.owner_name || 'Sin asignar'}</span>
                      {item.expected_close_date ? <span className="rounded-full border border-white/10 bg-black/50 px-2 py-1">Cierre: {item.expected_close_date}</span> : null}
                    </div>
                  </article>
                ))}
                {!stageItems.length ? <div className="rounded-xl border border-dashed border-white/20 p-4 text-center text-sm text-white/40">Soltá acá una oportunidad</div> : null}
              </div>
            </section>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white/90">Forecast por etapa</h2>
          <div className="mt-4 space-y-3">
            {(forecast?.by_stage || []).map((row) => (
              <div key={row.stage} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                <div>
                  <div className="font-medium text-white/80">{row.stage}</div>
                  <div className="text-xs text-white/50">{row.count} oportunidades</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white/90">{currency(row.amount)}</div>
                  <div className="text-xs text-white/50">Ponderado: {currency(row.weighted_amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white/90">Métricas por vendedor</h2>
          <div className="mt-4 space-y-3">
            {(forecast?.by_owner || []).map((row, idx) => (
              <div key={`${row.owner_user_id || 'none'}-${idx}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                <div>
                  <div className="font-medium text-white/80">{row.owner_name || 'Sin asignar'}</div>
                  <div className="text-xs text-white/50">{row.count} oportunidades</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white/90">{currency(row.amount)}</div>
                  <div className="text-xs text-white/50">Forecast: {currency(row.weighted_amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
