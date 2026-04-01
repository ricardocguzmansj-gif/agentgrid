import ExecutiveDashboard from "@/components/executive-dashboard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";


export default async function ReportsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/reports");

  return (
    <main className="container-shell py-8">
      <ExecutiveDashboard />
    </main>
  );
}
