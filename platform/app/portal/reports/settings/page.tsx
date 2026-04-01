export const dynamic = 'force-dynamic';
import { getSupabaseServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { ReportSubscriptionsManager } from "@/components/report-subscriptions-manager";


export default async function ReportSettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/reports/settings");

  return (
    <main className="container-shell py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Ajustes de Reportes Automáticos</h1>
        <p className="text-slate-500 mt-2">
          Configura suscripciones para recibir el estado de tus ventas y oportunidades de forma automática 
          por correo electrónico o WhatsApp, directamente a tu dispositivo móvil o el de tus socios.
        </p>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <ReportSubscriptionsManager />
      </div>
    </main>
  );
}
