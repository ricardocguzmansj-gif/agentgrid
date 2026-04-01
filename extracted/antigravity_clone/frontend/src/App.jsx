import { useEffect, useMemo, useState } from 'react'
import StatusCard from './components/StatusCard'
import { actOnRun, createAgent, createRun, getAgents, getRuns, getWebSocketUrl } from './lib/api'

const initialAgent = {
  name: 'Sales Demo Agent',
  description: 'Agente de demostración listo para vender como base del producto.',
  provider: 'mock',
  model: 'mock-reasoner',
  default_max_runtime_sec: 120,
  default_max_steps: 8,
  default_budget_usd: 0.25,
  tools_json: { web: false, email: false, human_approval: true },
}

export default function App() {
  const [agents, setAgents] = useState([])
  const [runs, setRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    const [agentsData, runsData] = await Promise.all([getAgents(), getRuns()])
    setAgents(agentsData)
    setRuns(runsData)
    if (!selectedRun && runsData.length) setSelectedRun(runsData[0])
  }

  useEffect(() => {
    refresh().catch(() => setError('No se pudo cargar el dashboard'))
  }, [])

  useEffect(() => {
    if (!selectedRun?.id) return
    const ws = new WebSocket(getWebSocketUrl(selectedRun.id))
    ws.onmessage = (event) => setLive(JSON.parse(event.data))
    ws.onerror = () => setError('Fallo de conexión WebSocket')
    return () => ws.close()
  }, [selectedRun?.id])

  const totals = useMemo(() => {
    const active = runs.filter((r) => ['queued', 'running', 'paused'].includes(r.status)).length
    const completed = runs.filter((r) => r.status === 'finished').length
    const timeouts = runs.filter((r) => r.status === 'timeout').length
    return { active, completed, timeouts }
  }, [runs])

  const createDemoAgent = async () => {
    setLoading(true)
    setError('')
    try {
      await createAgent(initialAgent)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const launchRun = async (agentId) => {
    setLoading(true)
    setError('')
    try {
      const run = await createRun({
        agent_id: agentId,
        input_json: { goal: 'Preparar propuesta comercial y reporte final', target_steps: 5 },
      })
      await refresh()
      setSelectedRun(run)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const doAction = async (action) => {
    if (!selectedRun?.id) return
    setLoading(true)
    try {
      await actOnRun(selectedRun.id, action)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#f3f4f6', minHeight: '100vh', color: '#111827' }}>
      <header style={{ padding: 24, background: 'linear-gradient(135deg, #0f172a, #1d4ed8)', color: 'white' }}>
        <h1 style={{ margin: 0 }}>AgentGrid</h1>
        <p style={{ marginTop: 8, maxWidth: 700 }}>
          Plataforma base para vender agentes con control de tiempo, pasos, presupuesto y monitoreo en vivo.
        </p>
      </header>

      <main style={{ padding: 24, display: 'grid', gap: 24 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <StatusCard title="Runs activos" value={totals.active} />
          <StatusCard title="Runs finalizados" value={totals.completed} />
          <StatusCard title="Timeouts" value={totals.timeouts} />
          <StatusCard title="Agentes" value={agents.length} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ marginTop: 0 }}>Agentes</h2>
              <button onClick={createDemoAgent} disabled={loading} style={{ padding: '10px 14px', borderRadius: 12, border: 0, background: '#111827', color: 'white' }}>
                Crear agente demo
              </button>
            </div>
            {agents.length === 0 ? <p>No hay agentes creados.</p> : null}
            <div style={{ display: 'grid', gap: 12 }}>
              {agents.map((agent) => (
                <div key={agent.id} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 700 }}>{agent.name}</div>
                  <div style={{ fontSize: 14, color: '#4b5563', marginTop: 6 }}>{agent.description}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    {agent.provider} · {agent.model} · {agent.default_max_runtime_sec}s · {agent.default_max_steps} pasos
                  </div>
                  <button onClick={() => launchRun(agent.id)} disabled={loading} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, border: 0, background: '#2563eb', color: 'white' }}>
                    Lanzar run
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 18, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Runs recientes</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {runs.map((run) => (
                <button key={run.id} onClick={() => setSelectedRun(run)} style={{ textAlign: 'left', padding: 14, borderRadius: 14, border: selectedRun?.id === run.id ? '2px solid #2563eb' : '1px solid #e5e7eb', background: '#fff' }}>
                  <div style={{ fontWeight: 700 }}>{run.status.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: '#4b5563' }}>{run.id}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {run.steps_used}/{run.max_steps} pasos · ${run.spent_usd} / ${run.budget_usd}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: 'white', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ marginTop: 0 }}>Monitoreo en vivo</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => doAction('pause')} disabled={!selectedRun || loading} style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: '#f59e0b', color: 'white' }}>Pausar</button>
              <button onClick={() => doAction('resume')} disabled={!selectedRun || loading} style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: '#10b981', color: 'white' }}>Reanudar</button>
              <button onClick={() => doAction('cancel')} disabled={!selectedRun || loading} style={{ padding: '8px 12px', borderRadius: 10, border: 0, background: '#ef4444', color: 'white' }}>Cancelar</button>
            </div>
          </div>

          {!selectedRun ? <p>Seleccioná un run.</p> : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <StatusCard title="Estado" value={live?.status || selectedRun.status} />
                <StatusCard title="Tiempo restante" value={`${live?.remaining_sec ?? selectedRun.remaining_sec}s`} />
                <StatusCard title="Pasos" value={`${live?.steps_used ?? selectedRun.steps_used}/${live?.max_steps ?? selectedRun.max_steps}`} />
                <StatusCard title="Costo" value={`$${live?.spent_usd ?? selectedRun.spent_usd}`} help={`Presupuesto: $${live?.budget_usd ?? selectedRun.budget_usd}`} />
              </div>
              <pre style={{ background: '#0f172a', color: '#e5e7eb', padding: 16, borderRadius: 16, overflow: 'auto' }}>
{JSON.stringify(live?.output_json || selectedRun.output_json || {}, null, 2)}
              </pre>
            </div>
          )}
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        </section>
      </main>
    </div>
  )
}
