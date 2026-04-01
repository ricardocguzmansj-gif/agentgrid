import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { CompanyAdminForm } from '@/components/company-admin-form';


export default async function AdminEmpresasPage() {
  await requireAdminUser();
  const supabase = getSupabaseAdminClient();
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, slug, plan, status, created_at, company_settings(industry, brand_name)')
    .order('created_at', { ascending: false });

  return (
    <main className="container-shell py-16 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Multiempresa</p>
          <h1 className="mt-3 text-4xl font-semibold">Gestión de empresas cliente</h1>
          <p className="mt-3 text-white/70">El admin general puede dar de alta tenants, asignar owners y activar IA por cada empresa.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="button-secondary">Volver al dashboard</Link>
          <Link href="/portal" className="button-primary">Abrir portal</Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <CompanyAdminForm />
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Empresas activas</p>
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Industria</th><th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(companies || []).map((company) => (
                  <tr key={company.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{Array.isArray((company as any).company_settings) ? (company as any).company_settings[0]?.brand_name || company.name : (company as any).company_settings?.brand_name || company.name}</p>
                      <p className="text-white/50">/{company.slug}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{company.plan}</td>
                    <td className="px-4 py-3 capitalize">{Array.isArray((company as any).company_settings) ? (company as any).company_settings[0]?.industry || 'general' : (company as any).company_settings?.industry || 'general'}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-white/10 px-3 py-1 capitalize">{company.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
