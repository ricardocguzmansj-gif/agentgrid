import type { ProductCard, StrategyMilestone, VideoScene } from './types';

export const products: ProductCard[] = [
  {
    name: 'Publicalogratis.com',
    url: 'https://publicalogratis.com',
    description: 'Marketplace tipo clasificados para captar tráfico, publicar anuncios y monetizar por visibilidad, servicios y upsells.',
  },
  {
    name: 'Publicalogratis.store',
    url: 'https://publicalogratis.store',
    description: 'Tiendas online gratis para emprendedores, con una entrada ideal a planes premium y automatización comercial.',
  },
  {
    name: 'Turnos.publicalogratis.com',
    url: 'https://turnos.publicalogratis.com',
    description: 'Mall de turnos para reservas, salud, belleza y servicios, listo para sumar recordatorios y agentes de atención.',
  },
];

export const videoScenes: VideoScene[] = [
  {
    id: 1,
    title: 'Hook de alto impacto',
    duration: '0:00–0:30',
    objective: 'Captar atención con dolor + oportunidad.',
    visual: 'Plano tuyo a cámara + texto grande “Empleados digitales 24/7”.',
    script:
      '¿Y si pudieras tener empleados digitales que venden, responden y hacen seguimiento las 24 horas, sin aumentar tu estructura? Eso es exactamente lo que construimos en Digital Sun SaaS Factory.',
  },
  {
    id: 2,
    title: 'El problema del mercado',
    duration: '0:30–2:30',
    objective: 'Mostrar ineficiencias actuales de las empresas.',
    visual: 'Capturas de WhatsApp, Excel, CRM desordenado, equipo saturado.',
    script:
      'La mayoría de las empresas pierde ventas por no responder rápido, no hacer seguimiento y depender demasiado de tareas manuales. Eso frena crecimiento y rentabilidad.',
  },
  {
    id: 3,
    title: 'La solución',
    duration: '2:30–5:00',
    objective: 'Presentar la plataforma y sus módulos.',
    visual: 'Dashboard de la plataforma, landing, formulario, panel de afiliados.',
    script:
      'Con nuestra plataforma podés lanzar una operación completa: landing premium, captura de leads, automatización de seguimiento, afiliados y una demo comercial para vender agentes de IA a empresas.',
  },
  {
    id: 4,
    title: 'Demo en vivo',
    duration: '5:00–10:00',
    objective: 'Probar facilidad de uso y valor tangible.',
    visual: 'Crear un lead, ver el ref, disparar seguimiento y mostrar panel.',
    script:
      'Voy a mostrarlo en vivo. Un visitante entra a la landing, completa el formulario, queda registrado en Supabase, se agenda una secuencia automática y el equipo comercial recibe la oportunidad.',
  },
  {
    id: 5,
    title: 'Oferta y urgencia',
    duration: '10:00–12:00',
    objective: 'Cerrar con una oferta simple y demo.',
    visual: 'Tabla de planes, CTA final y agenda demo.',
    script:
      'Si querés lanzar algo así para tu empresa, podés empezar con una demo estratégica, validar en días y luego escalar con campañas, afiliados y automatización comercial.',
  },
];

export const strategyPlan: StrategyMilestone[] = [
  {
    phase: 'Fase 1 — 0 a 50 clientes',
    goal: 'Cerrar rápido con venta consultiva y demos asistidas.',
    actions: [
      'Prospección manual diaria en LinkedIn, WhatsApp y red local.',
      '10 demos semanales usando la página /demo.',
      '1 caso de uso por nicho: salud, inmobiliarias, gastronomía, educación.',
    ],
    kpis: ['20% tasa de agendamiento', '30% tasa de cierre sobre demos', 'CAC controlado por canal'],
  },
  {
    phase: 'Fase 2 — 50 a 200 clientes',
    goal: 'Convertir el sistema en máquina repetible.',
    actions: [
      'Activar afiliados con comisión recurrente.',
      'Lanzar video semanal en YouTube y 3 clips cortos.',
      'Automatizar email y remarketing desde la base de leads.',
    ],
    kpis: ['100 leads/mes', '10 afiliados activos', 'MRR en crecimiento mensual'],
  },
  {
    phase: 'Fase 3 — 200 a 1.000 clientes',
    goal: 'Escala por canal y partner network.',
    actions: [
      'Ads en Meta y YouTube con embudo a demo.',
      'Programa de partners para agencias, consultores y revendedores.',
      'Webinars y workshops con oferta de implementación express.',
    ],
    kpis: ['1.000 leads/mes', 'LTV/CAC > 3', 'Churn < 4% mensual'],
  },
];
