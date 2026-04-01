export const dynamic = 'force-dynamic';
import Link from 'next/link';


export default function CheckoutSuccessPage() {
  return (
    <main className="container-shell py-20">
      <div className="card mx-auto max-w-3xl p-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Pago recibido</p>
        <h1 className="mt-4 text-4xl font-semibold">Tu checkout fue procesado</h1>
        <p className="mt-4 text-lg text-white/70">
          Si el webhook está configurado, la venta ya quedó registrada en Supabase y el afiliado recibió su atribución automática.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/admin/ventas" className="button-primary">Ver ventas</Link>
          <Link href="/pricing" className="button-secondary">Volver a pricing</Link>
        </div>
      </div>
    </main>
  );
}
