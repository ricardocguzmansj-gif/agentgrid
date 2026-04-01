import Link from 'next/link';
import { SectionTitle } from '@/components/section-title';
import { videoScenes } from '@/lib/content';

export const runtime = 'edge';

export default function DemoPage() {
  return (
    <main className="container-shell py-16">
      <SectionTitle
        eyebrow="Demo de funcionamiento"
        title="Guion de venta completo + escenas para grabar tu video"
        text="Usá esta página como soporte en reuniones, webinars, YouTube o una demo guiada con cliente final."
      />

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card overflow-hidden">
          <div className="aspect-video w-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 p-8">
            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/20 text-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Video block</p>
                <p className="mt-3 text-3xl font-semibold">Insertá acá tu video de YouTube o Vimeo</p>
                <p className="mt-2 text-white/60">Duración sugerida: 12 a 20 minutos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            'Crear un lead desde la landing.',
            'Ver el registro en Supabase.',
            'Disparar /api/cron/followups para simular envíos.',
            'Mostrar la cookie ?ref= de un afiliado.',
            'Explicar planes Starter, Pro y Scale.',
          ].map((step) => (
            <div key={step} className="card p-5 text-white/80">{step}</div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6">
        {videoScenes.map((scene) => (
          <article key={scene.id} className="card p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Escena {scene.id}</p>
                <h3 className="mt-2 text-2xl font-semibold">{scene.title}</h3>
              </div>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">{scene.duration}</span>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div>
                <p className="text-sm text-white/50">Objetivo</p>
                <p className="mt-2 text-white/80">{scene.objective}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Visual</p>
                <p className="mt-2 text-white/80">{scene.visual}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Guion sugerido</p>
                <p className="mt-2 text-white/80">{scene.script}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link className="button-primary" href="/">Volver a la landing</Link>
        <Link className="button-secondary" href="/estrategia">Ver estrategia 1.000 clientes</Link>
      </div>
    </main>
  );
}
