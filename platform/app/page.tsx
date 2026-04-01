import Link from 'next/link';
import { LeadForm } from '@/components/lead-form';
import { SectionTitle } from '@/components/section-title';
import { products } from '@/lib/content';
import { plans } from '@/lib/plans';
import { PricingCard } from '@/components/pricing-card';


const benefits = [
  'Convierte visitas en demos con una landing pensada para cerrar ventas B2B.',
  'Captura leads en Supabase con validación Cloudflare Turnstile y tracking por campaña.',
  'Activa secuencias automáticas de seguimiento para que el lead no se enfríe.',
  'Escala con afiliados, partners y campañas pagas sin rehacer la infraestructura.',
  'Mide pipeline, revenue, comisiones y crecimiento desde un panel conectado a Supabase.',
  'Desplegá en Cloudflare con una base moderna, rápida y lista para crecer.',
];

const stats = [
  { value: '24/7', label: 'captura y respuesta inicial' },
  { value: '< 48 h', label: 'para salir con piloto comercial' },
  { value: '1 stack', label: 'landing + CRM + afiliados + checkout' },
  { value: '1.000+', label: 'clientes como objetivo de escala' },
];

const screenshots = [
  {
    title: 'Landing y dashboard comercial',
    text: 'Presentación premium, propuesta de valor clara, CTA fuerte y un panel visual para explicar rápido cómo se mueve el pipeline.',
    image: '/screenshot-dashboard.svg',
  },
  {
    title: 'Captura de leads y CRM operativo',
    text: 'Formularios orientados a demo, seguimiento automático y tablero para ventas, revenue y métricas comerciales.',
    image: '/screenshot-crm.svg',
  },
  {
    title: 'Afiliados y crecimiento por partners',
    text: 'Links con tracking por referido, comisiones recurrentes y un modelo perfecto para agencias, revendedores y partners.',
    image: '/screenshot-affiliates.svg',
  },
];

const proofItems = [
  {
    title: 'Implementación rápida',
    text: 'No obliga a reemplazar tus sistemas. Se monta como una operación comercial paralela y luego se integra.',
  },
  {
    title: 'Mensaje premium',
    text: 'Textos preparados para vender automatización, agentes de IA, marketplaces, reservas y soluciones SaaS.',
  },
  {
    title: 'Base comercial real',
    text: 'Lead capture, pricing, afiliados, checkout y secuencias; no es una landing vacía, es una máquina de ventas.',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="container-shell grid gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            Digital Sun SaaS Factory · Branding premium · Node + Supabase + Cloudflare
          </div>
          <div className="space-y-5">
            <h1 className="max-w-5xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Vendé automatización, agentes de IA y soluciones SaaS con una presencia corporativa que transmite confianza.
            </h1>
            <p className="max-w-3xl text-lg text-white/70 sm:text-xl">
              Esta implementación combina branding, narrativa comercial, captura de leads, afiliados, checkout y demo de funcionamiento en un solo producto listo para deploy y orientado a empresas.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link className="button-primary" href="#demo-form">Solicitar demo estratégica</Link>
            <Link className="button-secondary" href="/demo">Ver demo con guion comercial</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="card p-5 text-sm text-white/80">
                {benefit}
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden p-4 shadow-glow sm:p-5">
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/50">
            <span>Vista ejecutiva</span>
            <span>Digital Sun</span>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#08101E] p-3">
            <img src="/screenshot-dashboard.svg" alt="Vista principal del dashboard comercial de Digital Sun SaaS Factory" className="w-full rounded-[24px] border border-white/10" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-cyan-300">Oferta</p>
              <p className="mt-2 text-lg font-semibold">Demo + implementación</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-cyan-300">Canales</p>
              <p className="mt-2 text-lg font-semibold">Orgánico, partners y ads</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-cyan-300">Cierre</p>
              <p className="mt-2 text-lg font-semibold">Checkout conectado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-8">
        <div className="card grid gap-6 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Posicionamiento</p>
            <h2 className="mt-3 text-3xl font-semibold">No vendés solo tecnología. Vendés una forma más rentable de crecer.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {proofItems.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="screenshots" className="container-shell py-16">
        <SectionTitle
          eyebrow="Screenshots demo"
          title="Capturas de producto para presentar en reuniones, campañas y propuestas"
          text="Quedaron integradas dentro del proyecto para que tu landing se sienta como un producto serio desde el primer segundo."
        />
        <div className="mt-10 space-y-8">
          {screenshots.map((shot, index) => (
            <div key={shot.title} className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <img src={shot.image} alt={shot.title} className="w-full rounded-[24px] border border-white/10 bg-black/20" />
              </div>
              <div className={`flex flex-col justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Módulo {index + 1}</p>
                <h3 className="mt-3 text-3xl font-semibold">{shot.title}</h3>
                <p className="mt-4 max-w-xl text-white/70">{shot.text}</p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link className="button-secondary" href="/demo">Usar en demo</Link>
                  <Link className="button-secondary" href="/admin">Ver panel</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="productos" className="container-shell py-16">
        <SectionTitle
          eyebrow="Ecosistema"
          title="Los activos que hacen más creíble tu propuesta"
          text="La landing presenta tu ecosistema real y transforma visitas en oportunidades de negocio listas para cierre."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {products.map((product) => (
            <a key={product.name} href={product.url} target="_blank" rel="noreferrer" className="card p-6 transition hover:-translate-y-1 hover:border-cyan-300/30">
              <h3 className="text-2xl font-semibold">{product.name}</h3>
              <p className="mt-3 text-white/70">{product.description}</p>
              <span className="mt-6 inline-flex text-sm text-cyan-300">Abrir sitio ↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Cómo se vende"
              title="Un embudo que convierte interés en demos, demos en cierres y cierres en crecimiento"
              text="La base está pensada para campañas, tráfico orgánico, afiliados y seguimiento comercial automatizado."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                '1. Tráfico a landing con CTA directa y propuesta clara.',
                '2. Captura de lead con objetivo comercial y tracking de origen.',
                '3. Secuencia automática y aviso a ventas o WhatsApp.',
                '4. Demo guiada con guion, escenas y screenshots de apoyo.',
                '5. Oferta con pricing, checkout y link de afiliado.',
                '6. Escalado por contenido, ads, partners y referidos.',
              ].map((item) => (
                <div key={item} className="card p-5 text-white/80">{item}</div>
              ))}
            </div>
          </div>
          <div id="demo-form">
            <LeadForm />
          </div>
        </div>
      </section>

      <section className="container-shell py-16" id="pricing">
        <SectionTitle
          eyebrow="Planes"
          title="Cobrá online con checkout real y una oferta lista para presentar"
          text="Conectá Stripe o Mercado Pago, dispará el checkout desde esta landing y registrá cada operación en Supabase para medir MRR, revenue y comisiones."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="card grid gap-8 p-8 lg:grid-cols-3 lg:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">CTA final</p>
            <h3 className="mt-3 text-3xl font-semibold">Mostrá una imagen premium, captá el lead y cerrá con una demo convincente.</h3>
          </div>
          <p className="text-white/70 lg:col-span-1">
            Llevá este proyecto a tu dominio, conectalo con Supabase, activá el cron de Cloudflare y usalo como base comercial principal de Digital Sun SaaS Factory.
          </p>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Link className="button-primary" href="/demo">Ver demo</Link>
            <Link className="button-secondary" href="/afiliados">Activar afiliados</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
