import { PricingCard } from '@/components/pricing-card';
import { SectionTitle } from '@/components/section-title';
import { plans } from '@/lib/plans';

export const runtime = 'edge';

export default function PricingPage() {
  return (
    <main className="container-shell py-16">
      <SectionTitle
        eyebrow="Pricing"
        title="Planes listos para vender y cobrar online"
        text="Esta página dispara checkout real con Stripe o Mercado Pago según tu configuración. También deja rastro en Supabase para métricas y comisiones."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
    </main>
  );
}
