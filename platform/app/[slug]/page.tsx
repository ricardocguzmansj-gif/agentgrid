import { notFound } from 'next/navigation';
import { getCompanyBySlug } from '@/lib/tenant';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const company = await getCompanyBySlug(resolvedParams.slug);
  
  if (!company) {
    return { title: 'Página no encontrada' };
  }
  
  const brandName = company.settings?.brand_name || company.name;
  return {
    title: `${brandName} - Contacto IA`,
    description: `Asistente Inteligente oficial de ${brandName}.`,
  };
}

export default async function PublicCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const company = await getCompanyBySlug(resolvedParams.slug);

  if (!company) {
    notFound();
  }

  const primary = company.settings?.primary_color || '#22d3ee';
  const accent = company.settings?.accent_color || '#8b5cf6';
  const brandName = company.settings?.brand_name || company.name;
  const agents = company.agents || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0A] flex flex-col items-center justify-center py-20 px-4">
      {/* Dynamic Background Blurs */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: primary }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: accent }}
      />

      <main className="relative z-10 w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Profile */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold bg-white/5 border border-white/10"
            style={{ 
              boxShadow: `0 0 40px ${primary}40`,
              color: primary 
            }}
          >
            {company.settings?.logo_url ? (
              <img src={company.settings.logo_url} alt={brandName} className="w-full h-full object-cover rounded-full" />
            ) : (
              brandName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">{brandName}</h1>
            <p className="text-white/60 max-w-sm mx-auto p-4 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10">
              {company.settings?.industry ? `Expertos en ${company.settings.industry}. ` : ''}
              Estamos aquí para ayudarte a través de nuestros asistentes virtuales con Inteligencia Artificial.
            </p>
          </div>
        </div>

        {/* Links / Agents Section */}
        <div className="w-full space-y-4 mt-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-center mb-6" style={{ color: primary }}>
            Nuestros Agentes IA
          </h2>
          
          {agents.length > 0 ? (
            agents.map((agent: any) => (
              <div 
                key={agent.id}
                className="w-full relative group cursor-pointer"
              >
                <div 
                  className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 blur-md"
                  style={{ background: `linear-gradient(90deg, ${primary}40, ${accent}40)` }}
                />
                <div 
                  className="relative flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                  style={{ borderLeft: `4px solid ${primary}` }}
                >
                  <div>
                    <h3 className="font-medium text-white text-lg">{agent.name}</h3>
                    <p className="text-sm text-white/50 mt-1">Asistente Virtual • Presiona para chatear</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white transition-transform group-hover:scale-110"
                    style={{ color: primary }}
                  >
                    ➔
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-white/50">Esta empresa aún no tiene agentes activos.</p>
            </div>
          )}
        </div>

        {/* Contact info footer */}
        {(company.settings?.support_email || company.settings?.support_phone || company.settings?.website_url) && (
          <div className="pt-12 text-center text-sm text-white/40 space-y-2">
            <p>Contacto oficial de {brandName}</p>
            <div className="flex justify-center items-center gap-4">
              {company.settings?.support_email && (
                <a href={`mailto:${company.settings.support_email}`} className="hover:text-white transition">Email</a>
              )}
              {company.settings?.support_phone && (
                <a href={`https://wa.me/${company.settings.support_phone.replace(/\+/g,'')}`} target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp</a>
              )}
              {company.settings?.website_url && (
                <a href={company.settings.website_url.startsWith('http') ? company.settings.website_url : `https://${company.settings.website_url}`} target="_blank" rel="noreferrer" className="hover:text-white transition">Web</a>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
