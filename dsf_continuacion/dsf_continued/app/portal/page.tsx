export default function PortalPage() {
  return (
    <main className="container">
      <h1>Portal de empresa</h1>
      <p className="muted">Acá cada empresa puede ver sus agentes, workflows, canal de WhatsApp y logs. La UI quedó simple para que la puedas extender rápido.</p>
      <div className="card">
        <h3>Prueba rápida</h3>
        <ol>
          <li>Configurar el canal en <code>whatsapp_channels</code>.</li>
          <li>Crear un agente activo en <code>ai_agents</code>.</li>
          <li>Apuntar Meta al webhook <code>/api/webhooks/whatsapp</code>.</li>
          <li>Enviar un mensaje desde WhatsApp al número de prueba.</li>
        </ol>
      </div>
    </main>
  )
}
