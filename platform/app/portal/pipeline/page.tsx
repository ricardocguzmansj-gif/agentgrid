import SalesPipelineKanban from '@/components/sales-pipeline-kanban'
import { getSupabaseServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function PortalPipelinePage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/portal/pipeline')

  return (
    <main className="container-shell py-8 space-y-6">
      <section className="card p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Portal / CRM</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Gestión de Ventas</h1>
        <p className="mt-2 text-white/70">Mueve tus oportunidades entre columnas para actualizar proyecciones de cierre automáticamente.</p>
      </section>
      
      <div className="card p-2 bg-transparent border-0">
        <SalesPipelineKanban />
      </div>
    </main>
  )
}
