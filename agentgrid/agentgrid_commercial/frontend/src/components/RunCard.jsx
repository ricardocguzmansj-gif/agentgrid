import { useEffect, useState } from 'react'
import { API, request } from '../lib/api'

export default function RunCard({ run, onRefresh }) {
  const [live, setLive] = useState(run)
  const [events, setEvents] = useState([])

  useEffect(() => {
    setLive(run)
    const ws = new WebSocket(`${API.replace('http', 'ws').replace('/api/v1','')}/ws/runs/${run.id}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLive((prev) => ({ ...prev, ...data }))
      } catch (_) {}
    }
    return () => ws.close()
  }, [run.id])

  async function loadEvents() {
    const data = await request(`/runs/${run.id}/events`)
    setEvents(data)
  }

  async function action(path) {
    await request(`/runs/${run.id}/${path}`, { method: 'POST' })
    await onRefresh()
    await loadEvents()
  }

  return (
    <div className="runItem">
      <h4>Run #{live.id.slice(0, 8)}</h4>
      <div className="muted small">Estado en vivo del agente</div>
      <p>
        <span className="chip">{live.status}</span>
        <span className="chip">Pasos: {live.steps_used}/{live.max_steps}</span>
        <span className="chip">Tiempo restante: {live.remaining_sec}s</span>
        <span className="chip">Gasto: ${Number(live.spent_usd || 0).toFixed(4)}</span>
      </p>
      <div className="row2">
        <button className="secondary" onClick={() => action('pause')}>Pausar</button>
        <button className="secondary" onClick={() => action('resume')}>Reanudar</button>
      </div>
      <div style={{height: 10}} />
      <div className="row2">
        <button className="secondary" onClick={() => action('cancel')}>Cancelar</button>
        <button onClick={loadEvents}>Ver eventos</button>
      </div>
      <h5>Salida</h5>
      <pre>{JSON.stringify(live.output_json || {}, null, 2)}</pre>
      {events.length > 0 && <>
        <h5>Eventos</h5>
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </>}
    </div>
  )
}
