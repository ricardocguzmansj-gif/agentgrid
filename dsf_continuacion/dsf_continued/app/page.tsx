export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <span className="muted">Digital Sun SaaS Factory</span>
        <h1 style={{ fontSize: 52, lineHeight: 1.05, margin: 0 }}>IA real + automatización completa + multiempresa</h1>
        <p className="muted" style={{ maxWidth: 760, fontSize: 18 }}>
          Esta versión agrega webhook inbound de WhatsApp, respuesta automática con OpenAI,
          portal por empresa, creación de tenants por admin general y cron ready para Cloudflare.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="button" href="/portal">Abrir portal</a>
          <a className="button" href="/admin/companies" style={{ background: '#b0d4ff' }}>Admin de empresas</a>
        </div>
      </section>

      <section className="grid grid-3">
        <article className="card">
          <h3>Webhook inbound</h3>
          <p className="muted">Recibe mensajes reales desde WhatsApp Cloud API, valida el verify token y procesa payloads de mensajes entrantes.</p>
        </article>
        <article className="card">
          <h3>Respuesta con OpenAI</h3>
          <p className="muted">Cada empresa usa su agente y prompt por nicho. El backend genera la respuesta y la devuelve al usuario por WhatsApp.</p>
        </article>
        <article className="card">
          <h3>Multiempresa</h3>
          <p className="muted">El admin general crea empresas, asigna owners y cada tenant opera con branding, automatizaciones y agentes propios.</p>
        </article>
      </section>
    </main>
  )
}
