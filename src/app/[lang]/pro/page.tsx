import Link from "next/link";

export default async function ProLandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center relative overflow-hidden pb-20">
      {/* Sfondo Radiale Astratto */}
      <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-5xl mt-20 p-6 relative z-10">
        
        {/* Intestazione */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            AirDex <span className="text-amber-500">PRO</span>
          </h1>
          <p className="text-slate-400 font-mono tracking-widest text-sm md:text-base max-w-2xl mx-auto">
            IL LIVELLO DI ACCESSO CLASSIFICATO PER L'ELITE DELL'AVIAZIONE. SBLOCCA L'HANGAR PRIVATO E COSTRUISCI LA TUA EREDITÀ.
          </p>
        </div>

        {/* Griglia Vantaggi */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Card 1 */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Hangar Personale</h3>
            <p className="text-slate-400 text-sm font-mono leading-relaxed">
              Colleziona i tuoi aerei preferiti in un'area riservata. Visualizza la tua flotta senza restrizioni e organizza i modelli acquisiti.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-amber-900/50 p-8 rounded-2xl hover:border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500 text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Logbook Voli Storici</h3>
            <p className="text-slate-400 text-sm font-mono leading-relaxed">
              Traccia i voli su cui sei stato passeggero. Associa codici di volo reali ai modelli della tua flotta personale.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Dati Tecnici Hi-Res</h3>
            <p className="text-slate-400 text-sm font-mono leading-relaxed">
              Accesso prioritario ai blueprint olografici ad altissima risoluzione e alle livree storiche esclusive senza interruzioni pubblicitarie.
            </p>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="bg-slate-900/80 backdrop-blur-lg border border-amber-500/30 rounded-3xl p-10 md:p-14 text-center max-w-3xl mx-auto shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent left-0" />
          
          <h2 className="text-3xl font-bold text-white mb-2">Inizia la tua espansione</h2>
          <p className="text-slate-400 mb-8 font-mono text-sm">Sostieni lo sviluppo di AirDex e sblocca subito tutte le funzionalità.</p>
          
          <div className="flex justify-center items-end gap-2 mb-10">
            <span className="text-5xl font-black text-amber-500 tracking-tighter">$9.99</span>
            <span className="text-slate-500 font-mono mb-1">/ mese</span>
          </div>

          <Link href={`/${lang}/pro/checkout`} className="inline-block w-full md:w-auto bg-amber-500 text-amber-950 font-black px-12 py-4 rounded-full uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            Abilita Accesso Pro
          </Link>
          <p className="mt-6 text-xs text-slate-500 font-mono tracking-widest uppercase">
            Transazione Sicura tramite Stripe
          </p>
        </div>

      </div>
    </main>
  );
}