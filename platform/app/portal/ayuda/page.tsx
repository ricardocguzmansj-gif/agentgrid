export const dynamic = 'force-dynamic';
import { BookOpen, Bot, MessageSquare, Workflow, Kanban, ShieldCheck, Zap, Link as LucideLink } from 'lucide-react'


export default function HelpPage() {
  return (
    <main className="container-shell py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER TÍTULO PRINCIPAL */}
      <section className="card p-8 border border-white/10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 pointer-events-none" />
        <BookOpen className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400 font-semibold">Base de Conocimiento</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold text-white tracking-tight">Centro de Ayuda AgentGrid</h1>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto text-lg">
          Bienvenido a la plataforma centralizada de operaciones y ventas con IA. 
          Descubre cómo sacar el máximo provecho a cada módulo para escalar y automatizar tu negocio sin fricción.
        </p>
      </section>

      {/* GRID DE MÓDULOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* MODULO 1: AI PLAYGROUND */}
        <section className="card p-6 border border-white/5 hover:border-cyan-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
            <Bot className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">1. Agentes de IA (Playground)</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            Tus empleados digitales. Configura asistentes virtuales que hablan y venden por ti en piloto automático trabajando 24/7.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span><strong>System Prompt:</strong> Escribe instrucciones precisas (Ej. "Eres experto en cierres"). La IA adoptará esa personalidad para tratar a los clientes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span><strong>Modelo y Temperatura:</strong> Elige entre GPT-4 o Claude. Baja latemperatura a 0.1 para que la IA sea precisa y estructurada.</span>
            </li>
          </ul>
        </section>

        {/* MODULO 2: CANALES Y WHATSAPP */}
        <section className="card p-6 border border-white/5 hover:border-green-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
            <LucideLink className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">2. Omnicanalidad (WhatsApp)</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            Conecta la API oficial de WhatsApp (Meta Cloud) para entubar todos los mensajes entrantes hacia una sola plataforma gestionable.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">•</span>
              <span><strong>Webhook Seguro:</strong> Cada vez que el cliente escribe a tu WhatsApp Empresa, el mensaje se guarda en la base de datos de AgentGrid al instante.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">•</span>
              <span><strong>Auto-respuesta:</strong> Enlaza tu WhatsApp directamente al Agente IA para que conteste en segundos sin intervención humana.</span>
            </li>
          </ul>
        </section>

        {/* MODULO 3: BANDEJA DE ENTRADA */}
        <section className="card p-6 border border-white/5 hover:border-blue-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">3. Conversaciones Unificadas</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            La "Bandeja de entrada" para tu equipo de ventas o soporte humano, con herramientas avanzadas para organizar clientes diarios.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>Tomar Control:</strong> Desactiva la IA temporalmente para atender personalmente a un cliente importante sin que el bot interfiera.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong>Etiquetas y Notas:</strong> Clasifica los chats («Soporte», «Venta») y deja recordatorios internos para tus colegas (el cliente no los ve).</span>
            </li>
          </ul>
        </section>

        {/* MODULO 4: KANBAN Y CRM */}
        <section className="card p-6 border border-white/5 hover:border-emerald-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
            <Kanban className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">4. Pipeline Kanban & Forecast</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            Convierte a los contactos en dinero real. Visualiza, arrastra y proyecta los ingresos de tu empresa de forma dinámica y clara.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span><strong>Drag & Drop:</strong> Toma una tarjeta (Lead) de la columna "Nuevo" y arrástrala hacia la derecha a medida que avanza la negociación (hasta "Ganado").</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span><strong>Proyecciones (Ponderado):</strong> Cada etapa multiplica el valor de venta por su probabilidad ("Calificado" = 25%). La métrica Ponderada muestra la estimación final y segura de caja libre que tiene el negocio.</span>
            </li>
          </ul>
        </section>

        {/* MODULO 5: AUTOMATIZACIONES */}
        <section className="card p-6 border border-white/5 hover:border-purple-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
            <Workflow className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">5. Workflows (Flujos Automáticos)</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            Rutinas mecánicas que se ejecutan solas para que tu cerebro financiero dedique tiempo exclusicamente a tareas estratégicas.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Disparadores CRON:</strong> Programa tareas diarias ("Cada martes a las 10AM") o basadas en eventos (como "Cuando un lead cambia de etapa").</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span><strong>Daily Digests:</strong> Configura que el sistema extraiga un resumen con los KPIs de tus agentes IA y ventas, y te lo mande por correo cada noche.</span>
            </li>
          </ul>
        </section>

        {/* SEGURIDAD Y CONTEXTOS */}
        <section className="card p-6 border border-white/5 hover:border-orange-400/30 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Arquitectura Multi-Empresa</h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed">
            La seguridad está grabada en el núcleo del sistema con Row Level Security para aislamiento absoluto de la base de datos empresarial.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              <span><strong>Múltiples "Tenants":</strong> Agrupa datos (Ventas, Chats, Agentes) por entidad "Company". Lo que pasa en Empresa A es invisible en Empresa B.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              <span><strong>Roles de Equipo:</strong> Existe el "Propietario" (Owner) que configura accesos y el "Usuario" (Vendedor/Staff) que opera el tablero Kanban diario.</span>
            </li>
          </ul>
        </section>

      </div>

      {/* FOOTER CALL TO ACTION */}
      <section className="card p-6 border border-white/10 flex items-center justify-between mt-8 flex-col sm:flex-row gap-4 bg-gradient-to-br from-ink to-ink/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-full">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">¿Listo para escalar la operación SaaS?</h3>
            <p className="text-white/60 text-sm">Dirígete al Portal y comienza a vincular tus herramientas oficiales de inmediato.</p>
          </div>
        </div>
        <a href="/portal" className="inline-block px-6 py-2.5 rounded-xl font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-sm">
          Ir a mi Dashboard
        </a>
      </section>

    </main>
  )
}
