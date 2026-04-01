import { AffiliateForm } from '@/components/affiliate-form';
import { SectionTitle } from '@/components/section-title';


const bullets = [
  '30% de comisión mensual recurrente.',
  'Link único con tracking por cookie y lead.',
  'Panel simple para medir clicks, leads y comisiones.',
  'Ideal para agencias, consultores y revendedores.',
];

export default function AffiliatesPage() {
  return (
    <main className="container-shell grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Sistema de afiliados"
          title="Convertí a partners en tu fuerza de ventas externa"
          text="Esta base registra afiliados, genera enlaces únicos y asocia leads captados a su referente comercial."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="card p-5 text-white/80">{bullet}</div>
          ))}
        </div>
        <div className="card p-6 text-white/70">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Ejemplo de link</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm">
            https://digitalsaasfactory.com/?ref=partner-001
          </p>
        </div>
      </div>
      <AffiliateForm />
    </main>
  );
}
