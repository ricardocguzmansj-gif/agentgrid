import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
import { SectionTitle } from '@/components/section-title';


export default function LoginPage() {
  return (
    <main className="container-shell grid gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-8">
        <SectionTitle
          eyebrow="Acceso"
          title="Ingresá al panel comercial y operativo"
          text="Este acceso usa Supabase Auth. Para entrar al panel admin, tu email también debe estar habilitado en la variable ADMIN_EMAILS."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            'Dashboard de leads, ventas, MRR y afiliados.',
            'Protección por sesión y allowlist de administradores.',
            'Base lista para crecer a roles y multitenancy.',
            'Compatible con Cloudflare + Supabase Auth.',
          ].map((item) => (
            <div key={item} className="card p-5 text-white/80">{item}</div>
          ))}
        </div>
      </div>
      <Suspense fallback={<div className="card p-6 min-h-[400px] animate-pulse bg-white/5" />}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
