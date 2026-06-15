import { supabase } from "../../lib/supabase";
import AircraftCard from "../../components/AircraftCard";
import { AircraftModel } from "../../types";
import SearchAutocomplete from "../../components/SearchAutocomplete";
import Link from "next/link";

export const revalidate = 60; // Sincronizzazione automatica cache DB ogni 60 secondi

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // 1. Estrazione parallela dal Cockpit di Supabase (Ora con 6 query simultanee)
  const [
    { data: recentAircrafts },
    { data: featuredAircraft },
    { count: totalCount },
    { count: activeCount },
    { count: legendaryCount },
    { data: searchIndexData } // <-- 6a Query: Recupera i dati minimi per l'indice di ricerca
  ] = await Promise.all([
    // Griglia principale: Ultime aggiunte
    supabase
      .from("aircraft_models")
      .select(`*, manufacturers (name)`)
      .order("created_at", { ascending: false })
      .limit(3),
    // Aereo del Giorno: Estraiamo un aereo epico o leggendario per la vetrina premium
    supabase
      .from("aircraft_models")
      .select(`*, manufacturers (*)`)
      .or("rarity.eq.LEGENDARY,rarity.eq.EPIC")
      .limit(1)
      .single(),
    // Statistiche generali per i contatori di telemetria
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }),
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }).eq("rarity", "LEGENDARY"),
    // Index di ricerca: Scarica solo i dati necessari a fare il filtro istantaneo lato client
    supabase.from("aircraft_models").select("id, model_name, manufacturers(name)")
  ]);

  const flottaRecente = (recentAircrafts as unknown as AircraftModel[]) || [];
  const aereoDelGiorno = featuredAircraft as unknown as AircraftModel | null;

  // Formattiamo i dati della sesta query in un array pulito per l'autocomplete
  const searchIndex = (searchIndexData as any[])?.map(item => ({
    id: item.id,
    model_name: item.model_name,
    manufacturer: item.manufacturers?.name || "Sconosciuto"
  })) || [];

  // Calcolo dati storici
  const totale = totalCount || 0;
  const attivi = activeCount || 0;
  const storici = totale - attivi;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-24">
      
      {/* MATRIX BACKGROUND & RADAR SCANNER */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_30%,#020617_20%,transparent_100%)]"></div>
        {/* Cerchi concentrici del Radar */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] border border-cyan-500/10 rounded-full animate-[pulse_8s_infinite]"></div>
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] border border-cyan-500/5 rounded-full"></div>
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] border border-slate-800/40 rounded-full border-dashed animate-[spin_120s_linear_infinite]"></div>
      </div>

      {/* ------------------ HERO SECTION ------------------ */}
      <section className="relative z-10 pt-36 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <span className="text-cyan-400 font-mono text-xs uppercase tracking-[0.25em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#22d3ee]"></span>
            Sincronizzazione Avionica Globale Attiva
          </span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight mb-6 uppercase">
          AirDex Main Core
        </h1>
        <p className="text-slate-400 font-mono text-sm max-w-2xl mx-auto uppercase tracking-wider mb-12">
          L'Enciclopedia Definitiva e Registro di Telemetria per l'Aviazione Civile Mondiale.
        </p>
        
        {/* BARRA DI RICERCA PREDITTIVA */}
        <SearchAutocomplete lang={lang} searchIndex={searchIndex} />

        {/* TELEMETRIA DASHBOARD (STATISTICHE AVANZATE) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl relative">
          {[
            { label: "Vettori in Archivio", value: totale, sub: "OPERA OMNIA", color: "text-white", border: "border-slate-800" },
            { label: "Servizio di Linea Attivo", value: attivi, sub: "IN AIRSPACE NOW", color: "text-emerald-400", border: "border-emerald-950/50 bg-emerald-950/5" },
            { label: "Flotta Storica Ritirata", value: storici, sub: "CHRONO REPOSITORY", color: "text-amber-500", border: "border-amber-950/50 bg-amber-950/5" },
            { label: "Classe Leggendaria", value: legendaryCount || 0, color: "text-purple-400", sub: "MAX RARITY TIER", border: "border-purple-950/50 bg-purple-950/5" }
          ].map((stat, i) => (
            <div key={i} className={`border rounded-xl p-5 backdrop-blur-md hover:border-slate-600 transition-all group/stat relative overflow-hidden ${stat.border}`}>
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover/stat:bg-cyan-500 transition-colors"></div>
              <span className={`text-4xl font-black font-mono block tracking-tight ${stat.color}`}>{stat.value.toLocaleString()}</span>
              <span className="text-slate-300 text-xs font-bold block mt-2 uppercase tracking-wide">{stat.label}</span>
              <span className="text-[9px] font-mono text-slate-500 tracking-widest block mt-1">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------ SEZIONE: AEREO DEL GIORNO ------------------ */}
      {aereoDelGiorno && (
        <section className="relative z-10 px-4 max-w-7xl mx-auto py-16">
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-[0_0_5px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Corner Indicators stile HUD aeronautico */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Testo dell'aereo del giorno */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-cyan-500 font-mono text-xs uppercase tracking-[0.3em] font-black block mb-2">
                    // DAILY FLIGHT PLAN FEATURED
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                    {aereoDelGiorno.model_name}
                  </h2>
                  <p className="text-xl text-slate-400 font-medium mt-1">
                    {aereoDelGiorno.manufacturers?.name}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono text-xs space-y-2 text-slate-400">
                  <div className="flex justify-between"><span className="text-slate-500">PROPULSIONE:</span> <span className="text-white font-bold">{aereoDelGiorno.engines}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">STATUS OPERATIVO:</span> <span className={aereoDelGiorno.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-500'}>{aereoDelGiorno.status}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">INDICE DI RARITÀ:</span> <span className="text-purple-400 font-black">{aereoDelGiorno.rarity}</span></div>
                </div>

                {/* Grafici statistici live per gli appassionati */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>RAGGIO D'AZIONE MASSIMO</span>
                      <span className="text-cyan-400 font-bold">{aereoDelGiorno.range_km?.toLocaleString()} KM</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      {/* Percentuale calcolata su un raggio max ipotetico di 18.000km */}
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full" style={{ width: `${Math.min(((aereoDelGiorno.range_km || 0) / 18000) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>CONFIGURAZIONE MAX PAX</span>
                      <span className="text-cyan-400 font-bold">{aereoDelGiorno.max_passengers || 'N/D'} PASSEGGERI</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      {/* Percentuale calcolata su capienza max ipotetica di 850 pax */}
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${Math.min(((aereoDelGiorno.max_passengers || 0) / 850) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/${lang}/aircraft/${aereoDelGiorno.id}`} className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-colors w-full md:w-auto">
                    Apri Scheda Telemetrica Completa &rarr;
                  </Link>
                </div>
              </div>

              {/* Immagine 16:9 con vetrata olografica */}
              <div className="lg:col-span-7 w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-2xl">
                {aereoDelGiorno.house_livery_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={aereoDelGiorno.house_livery_url} 
                    alt={aereoDelGiorno.model_name}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 font-mono text-sm tracking-widest bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:30px_30px]">
                    <svg className="w-12 h-12 text-slate-800 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.543V10a5 5 0 00-5-5H3.581m0 0a23.99 23.99 0 0113.179-1.247M6 11h.01M9 16H5.113a2 2 0 00-1.997 1.851l-.112 1.343" />
                    </svg>
                    FOTO SATELLITARE ATTESA UPGRADE
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 font-mono text-[10px] text-cyan-400 px-3 py-1 rounded-md tracking-widest uppercase">
                  FIRST FLIGHT: {aereoDelGiorno.first_flight_year || 'N/D'}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ------------------ SEZIONE: NAVIGATORE ERE STORICHE ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-12">
        <div className="mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1 h-5 bg-cyan-500 rounded"></span>
            Cronologia Vettori per Epoca
          </h2>
          <p className="text-slate-400 font-mono text-xs mt-1">Esplorazione filtrata attraverso le grandi rivoluzioni dell'ingegneria aeronautica civili.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "I Pionieri & Elica", era: "1910 - 1945", desc: "Dagli albori in legno e tela ai motori radiali della Seconda Guerra Mondiale.", query: "era=pioneers", badge: "HISTORIC" },
            { title: "L'Età dell'Oro a Pistoni", era: "1946 - 1957", desc: "I giganti transoceanici commerciali a pistoni come il DC-6 e il Constellation.", query: "era=golden", badge: "HISTORIC" },
            { title: "L'Avvento del Motore a Getto", era: "1958 - 1999", desc: "La rivoluzione dei Jet. Dal Boeing 707, all'iconico 747 fino al supersonico Concorde.", query: "era=jetage", badge: "ACTIVE_HISTORIC" },
            { title: "Era Moderna & Widebody", era: "2000 - 2026", desc: "I giganti dei cieli in fibra di carbonio ad altissima efficienza energetica: A380, A350, 787.", query: "era=modern", badge: "ACTIVE" },
          ].map((epoch, i) => (
            <Link 
              href={`/${lang}/radar?${epoch.query}`} 
              key={i} 
              className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-cyan-500 font-mono text-xs font-bold tracking-wider">{epoch.era}</span>
                  <span className="text-[9px] font-mono border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase">{epoch.badge}</span>
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide mb-2 group-hover:text-cyan-400 transition-colors">{epoch.title}</h3>
                <p className="text-slate-400 text-xs font-normal leading-relaxed">{epoch.desc}</p>
              </div>
              <div className="text-cyan-500 font-mono text-[11px] uppercase tracking-wider mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                Inizializza Scansione &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------ SEZIONE: ULTIME AGGIUNTE ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-12">
        <div className="flex justify-between items-end mb-8 border-b border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1 h-5 bg-cyan-500 rounded"></span>
              Ultimi Ingressi in Linea di Volo
            </h2>
            <p className="text-slate-400 font-mono text-xs mt-1">Aggiornamenti strutturali e nuovi aeromobili validati dall'Admin Console.</p>
          </div>
          <Link href={`/${lang}/radar`} className="text-cyan-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-colors group">
            APRI RADAR COMPLETO <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* Griglia che ospita le AircraftCard del team */}
        <div className="flex gap-8 flex-wrap justify-center lg:justify-start">
          {flottaRecente.length > 0 ? (
            flottaRecente.map((aircraft) => (
              <AircraftCard key={aircraft.id} aircraft={aircraft} lang={lang} />
            ))
          ) : (
            <p className="text-slate-500 font-mono text-xs animate-pulse tracking-widest py-10">
              &gt; NESSUN VETTORE REGISTRATO NELLE ULTIME 24 ORE. SYSTEM IDLE.
            </p>
          )}
        </div>
      </section>

      {/* FOOTER SYSTEM INDICATOR */}
      <div className="text-center mt-20 text-[10px] font-mono text-slate-600 tracking-[0.3em] uppercase relative z-10">
        AirDex OS v4.2.1 // Supabase Relational Cluster Connected // Node Environment Active
      </div>

    </main>
  );
}