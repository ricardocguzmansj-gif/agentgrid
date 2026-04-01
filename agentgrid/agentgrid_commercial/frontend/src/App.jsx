import { useEffect, useMemo, useState } from 'react'
import { request } from './lib/api'
import RunCard from './components/RunCard'

const defaultRegister = {
  company_name: 'Digital Sun Demo',
  slug: 'digitalsun-demo',
  brand_name: 'Digital Sun AgentGrid',
  brand_tagline: 'Agentes autónomos listos para vender',
  owner_name: 'Ricardo Guzman',
  owner_email: 'owner@example.com',
  password: 'DemoPass123!',
  plan_code: 'pro',
}

const defaultAgent = {
  name: 'Closer Comercial IA',
  description: 'Responde consultas comerciales y prepara propuestas.',
  provider: 'mock',
  model: 'mock-reasoner',
  system_prompt: 'Actúa como un agente comercial B2B persuasivo, profesional y claro.',
  default_max_runtime_sec: 300,
  default_max_steps: 8,
  default_budget_usd: 0.5,
  tools_json: {}
}

export default function App() {
  const [auth, setAuth] = useState(null)
  const [plans, setPlans] = useState([])
  const [billing, setBilling] = useState(null)
  const [agents, setAgents] = useState([])
  const [runs, setRuns] = useState([])
  const [registerData, setRegisterData] = useState(defaultRegister)
  const [loginData, setLoginData] = useState({ email: 'owner@digitalsun.ai', password: 'ChangeThisNow123!' })
  const [agentData, setAgentData] = useState(defaultAgent)
  const [runPrompt, setRunPrompt] = useState('Genera una propuesta comercial para vender un asistente de ventas IA a una inmobiliaria de Argentina.')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [error, setError] = useState('')

  const isLogged = Boolean(auth?.access_token)
  const brandName = auth?.tenant?.brand_name || 'Digital Sun AgentGrid'

  useEffect(() => {
    request('/billing/plans').then(setPlans).catch(() => {})
    const token = localStorage.getItem('agentgrid_token')
    const cached = localStorage.getItem('agentgrid_auth')
    if (token && cached) {
      const parsed = JSON.parse(cached)
      setAuth(parsed)
    }
  }, [])

  useEffect(() => {
    if (isLogged) {
      refreshAll()
    }
  }, [isLogged])

  async function refreshAll() {
    const [billingData, agentsData, runsData] = await Promise.all([
      request('/billing/summary'),
      request('/agents'),
      request('/runs')
    ])
    setBilling(billingData)
    setAgents(agentsData)
    setRuns(runsData)
    if (!selectedAgentId && agentsData[0]?.id) setSelectedAgentId(agentsData[0].id)
  }

  async function registerTenant(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(registerData) })
      saveAuth(data)
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(loginData) })
      saveAuth(data)
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  function saveAuth(data) {
    localStorage.setItem('agentgrid_token', data.access_token)
    localStorage.setItem('agentgrid_auth', JSON.stringify(data))
    setAuth(data)
  }

  function logout() {
    localStorage.removeItem('agentgrid_token')
    localStorage.removeItem('agentgrid_auth')
    setAuth(null)
    setBilling(null)
    setAgents([])
    setRuns([])
  }

  async function createAgent(e) {
    e.preventDefault()
    setError('')
    try {
      await request('/agents', { method: 'POST', body: JSON.stringify(agentData) })
      setAgentData(defaultAgent)
      await refreshAll()
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  async function createRun(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { input_json: { prompt: runPrompt } }
      await request(`/runs/agent/${selectedAgentId}`, { method: 'POST', body: JSON.stringify(payload) })
      await refreshAll()
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  const subtitle = useMemo(() => {
    if (!billing) return 'Plataforma multiempresa para vender agentes con login, límites, planes y monitoreo.'
    return `Plan ${billing.plan.name} • ${billing.usage.agents} agentes • ${billing.usage.runs} runs`
  }, [billing])

  return (
    <div className="page">
      <section className="hero">
        <div className="heroCard">
          <span className="badge">READY TO SELL • WHITE-LABEL ORIENTADO A SAAS</span>
          <h1 className="title">{brandName}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        <div className="heroCard">
          <h3 className="sectionTitle">Qué vendés con esta versión</h3>
          <div className="list muted">
            <div>• Registro de cliente/tenant</div>
            <div>• Login con JWT</div>
            <div>• Planes Starter / Pro / Scale</div>
            <div>• Agentes por proveedor: Mock, OpenAI, Anthropic o Groq</div>
            <div>• Runs con límites de tiempo, pasos y presupuesto</div>
            <div>• Dashboard con estado en vivo y eventos</div>
          </div>
        </div>
      </section>

      {!isLogged ? (
        <div className="grid">
          <div className="stack">
            <div className="panel">
              <h3 className="sectionTitle">Entrar al demo</h3>
              <form className="list" onSubmit={login}>
                <input value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} placeholder="Email" />
                <input type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} placeholder="Password" />
                <button>Ingresar</button>
              </form>
              <p className="muted small">Usuario demo: owner@digitalsun.ai / ChangeThisNow123!</p>
            </div>

            <div className="panel">
              <h3 className="sectionTitle">Planes</h3>
              <div className="plans">
                {plans.map((plan) => (
                  <div className="plan" key={plan.id}>
                    <h4>{plan.name}</h4>
                    <div className="price">${plan.price_monthly_usd}<span className="muted small">/mes</span></div>
                    <div className="muted small">Hasta {plan.max_agents} agentes</div>
                    <div className="muted small">Hasta {plan.max_runtime_sec}s por run</div>
                    <div className="muted small">Hasta {plan.max_steps} pasos</div>
                    <div className="muted small">Presupuesto/run: ${plan.max_budget_per_run_usd}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="sectionTitle">Registrar nuevo cliente</h3>
            <form className="list" onSubmit={registerTenant}>
              <div className="row2">
                <input value={registerData.company_name} onChange={(e) => setRegisterData({ ...registerData, company_name: e.target.value })} placeholder="Empresa" />
                <input value={registerData.slug} onChange={(e) => setRegisterData({ ...registerData, slug: e.target.value })} placeholder="slug" />
              </div>
              <div className="row2">
                <input value={registerData.brand_name} onChange={(e) => setRegisterData({ ...registerData, brand_name: e.target.value })} placeholder="Marca" />
                <input value={registerData.brand_tagline} onChange={(e) => setRegisterData({ ...registerData, brand_tagline: e.target.value })} placeholder="Tagline" />
              </div>
              <div className="row2">
                <input value={registerData.owner_name} onChange={(e) => setRegisterData({ ...registerData, owner_name: e.target.value })} placeholder="Nombre del owner" />
                <input value={registerData.owner_email} onChange={(e) => setRegisterData({ ...registerData, owner_email: e.target.value })} placeholder="Email" />
              </div>
              <div className="row2">
                <input type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} placeholder="Password" />
                <select value={registerData.plan_code} onChange={(e) => setRegisterData({ ...registerData, plan_code: e.target.value })}>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
              <button>Crear tenant y empezar a vender</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid">
          <div className="stack">
            <div className="panel">
              <h3 className="sectionTitle">Resumen del cliente</h3>
              {billing && (
                <div className="kpis">
                  <div className="kpi">
                    <strong>{billing.plan.name}</strong>
                    <span className="muted">Plan actual</span>
                  </div>
                  <div className="kpi">
                    <strong>{billing.usage.agents}</strong>
                    <span className="muted">Agentes creados</span>
                  </div>
                  <div className="kpi">
                    <strong>{billing.usage.runs}</strong>
                    <span className="muted">Runs acumulados</span>
                  </div>
                </div>
              )}
              <div style={{height: 12}} />
              <button className="secondary" onClick={logout}>Cerrar sesión</button>
            </div>

            <div className="panel">
              <h3 className="sectionTitle">Crear agente</h3>
              <form className="list" onSubmit={createAgent}>
                <div className="row2">
                  <input value={agentData.name} onChange={(e) => setAgentData({ ...agentData, name: e.target.value })} placeholder="Nombre del agente" />
                  <select value={agentData.provider} onChange={(e) => setAgentData({ ...agentData, provider: e.target.value })}>
                    <option value="mock">Mock</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="groq">Groq</option>
                  </select>
                </div>
                <div className="row2">
                  <input value={agentData.model} onChange={(e) => setAgentData({ ...agentData, model: e.target.value })} placeholder="Modelo" />
                  <input type="number" value={agentData.default_budget_usd} onChange={(e) => setAgentData({ ...agentData, default_budget_usd: Number(e.target.value) })} placeholder="Budget USD" />
                </div>
                <textarea rows="4" value={agentData.description} onChange={(e) => setAgentData({ ...agentData, description: e.target.value })} placeholder="Descripción" />
                <textarea rows="4" value={agentData.system_prompt} onChange={(e) => setAgentData({ ...agentData, system_prompt: e.target.value })} placeholder="System prompt" />
                <button>Guardar agente</button>
              </form>
            </div>

            <div className="panel">
              <h3 className="sectionTitle">Lanzar run</h3>
              <form className="list" onSubmit={createRun}>
                <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
                  <option value="">Elegí un agente</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <textarea rows="4" value={runPrompt} onChange={(e) => setRunPrompt(e.target.value)} placeholder="Prompt del cliente" />
                <button>Ejecutar</button>
              </form>
            </div>
          </div>

          <div className="stack">
            <div className="panel">
              <h3 className="sectionTitle">Agentes</h3>
              <div className="list">
                {agents.map((agent) => (
                  <div className="agentItem" key={agent.id}>
                    <h4>{agent.name}</h4>
                    <div className="muted small">{agent.description}</div>
                    <p>
                      <span className="chip">{agent.provider}</span>
                      <span className="chip">{agent.model}</span>
                      <span className="chip">{agent.default_max_runtime_sec}s</span>
                    </p>
                  </div>
                ))}
                {agents.length === 0 && <div className="muted">Todavía no hay agentes.</div>}
              </div>
            </div>

            <div className="panel">
              <h3 className="sectionTitle">Runs recientes</h3>
              <div className="list">
                {runs.map((run) => (
                  <RunCard key={run.id} run={run} onRefresh={refreshAll} />
                ))}
                {runs.length === 0 && <div className="muted">Todavía no hay runs.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="danger">{error}</p>}
    </div>
  )
}
