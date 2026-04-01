import AdvancedConversationsCRM from '@/components/advanced-conversations-crm'

export const runtime = 'edge';

export default function PortalConversationsPage() {
  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM Conversacional Avanzado</h1>
          <p className="mt-2 text-zinc-400">
            Conversaciones, asignación de operadores, etiquetas, notas internas y embudo comercial.
          </p>
        </div>
        <AdvancedConversationsCRM />
      </div>
    </main>
  )
}
