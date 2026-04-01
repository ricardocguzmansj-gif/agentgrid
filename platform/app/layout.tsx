import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Sun SaaS Factory',
  description: 'Branding premium, landing corporativa, automatización de leads, afiliados, checkout y demo comercial listos para deploy con Node, Supabase y Cloudflare.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="container-shell flex items-center justify-between gap-4 py-4">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">DS</span>
              <span>
                Digital Sun <span className="text-cyan-300">SaaS Factory</span>
              </span>
            </Link>
            <nav className="hidden gap-6 text-sm text-white/80 md:flex">
              <Link href="/#screenshots">Screenshots</Link>
              <Link href="/#productos">Productos</Link>
              <Link href="/demo">Demo</Link>
              <Link href="/afiliados">Afiliados</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/portal">Portal</Link>
              <Link href="/portal/conversations">Conversaciones</Link>
              <Link href="/portal/pipeline">Pipeline</Link>
              <Link href="/portal/ayuda">Ayuda</Link>
              <Link href="/estrategia">1.000 clientes</Link>
              <Link href="/login">Login</Link>
            </nav>
            <div className="hidden md:block">
              <Link className="button-secondary" href="/#demo-form">Solicitar demo</Link>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
