const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export async function getAgents() {
  const res = await fetch(`${API_BASE}/agents`)
  return res.json()
}

export async function createAgent(payload) {
  const res = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('No se pudo crear el agente')
  return res.json()
}

export async function getRuns() {
  const res = await fetch(`${API_BASE}/runs`)
  return res.json()
}

export async function createRun(payload) {
  const res = await fetch(`${API_BASE}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('No se pudo crear el run')
  return res.json()
}

export async function actOnRun(runId, action) {
  const res = await fetch(`${API_BASE}/runs/${runId}/${action}`, { method: 'POST' })
  if (!res.ok) throw new Error(`No se pudo ejecutar ${action}`)
  return res.json()
}

export function getWebSocketUrl(runId) {
  const base = (import.meta.env.VITE_WS_BASE || 'ws://localhost:8000').replace(/\/$/, '')
  return `${base}/ws/runs/${runId}`
}
