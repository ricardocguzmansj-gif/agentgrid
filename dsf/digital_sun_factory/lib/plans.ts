export type PlanId = 'starter' | 'pro' | 'scale';

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  priceLabel: string;
  monthlyPrice: number;
  annualPrice: number;
  cta: string;
  features: string[];
  highlight?: boolean;
};

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para validar IA comercial en una empresa pequeña.',
    priceLabel: 'USD 49/mes',
    monthlyPrice: 49,
    annualPrice: 470,
    cta: 'Empezar Starter',
    features: [
      'Landing + leads + afiliados',
      'Hasta 2 automatizaciones activas',
      '1 panel comercial',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'El plan más vendible para PyMEs y agencias.',
    priceLabel: 'USD 149/mes',
    monthlyPrice: 149,
    annualPrice: 1430,
    cta: 'Elegir Pro',
    highlight: true,
    features: [
      'Todo lo de Starter',
      'Hasta 10 automatizaciones activas',
      'Dashboard comercial completo',
      'Checkout y métricas',
      'Soporte prioritario',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'Para empresas con mayor volumen, partners y operación multi-equipo.',
    priceLabel: 'USD 399/mes',
    monthlyPrice: 399,
    annualPrice: 3830,
    cta: 'Escalar ahora',
    features: [
      'Todo lo de Pro',
      'Usuarios internos ampliados',
      'Implementación guiada',
      'Comisiones avanzadas de afiliados',
      'Prioridad enterprise',
    ],
  },
];

export function getPlan(planId: string | null | undefined) {
  return plans.find((plan) => plan.id === planId) ?? plans[1];
}
