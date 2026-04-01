export const dynamic = 'force-dynamic';
import { SectionTitle } from '@/components/section-title';
import { strategyPlan } from '@/lib/content';


export default function StrategyPage() {
  return (
    <main className="container-shell py-16">
      <SectionTitle
        eyebrow="Estrategia"
        title="Plan práctico para llegar a 1.000 clientes"
        text="No es una lista decorativa: es una hoja de ruta accionable con hitos, KPIs y canales de adquisición."
      />

      <div className="mt-12 grid gap-6">
        {strategyPlan.map((milestone) => (
          <article key={milestone.phase} className="card p-6 lg:p-8">
            <h3 className="text-2xl font-semibold">{milestone.phase}</h3>
            <p className="mt-3 text-lg text-cyan-200">{milestone.goal}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Acciones</p>
                <ul className="mt-3 space-y-3 text-white/75">
                  {milestone.actions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">KPIs</p>
                <ul className="mt-3 space-y-3 text-white/75">
                  {milestone.kpis.map((kpi) => (
                    <li key={kpi}>• {kpi}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
