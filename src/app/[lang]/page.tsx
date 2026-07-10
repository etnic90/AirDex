import { supabase } from "../../lib/supabase";
import AircraftCard from "../../components/AircraftCard";
import { AircraftModel } from "../../types";
import SearchAutocomplete from "../../components/SearchAutocomplete";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isIt = lang === "it";
  const isEs = lang === "es";
  const isFr = lang === "fr";
  const isDe = lang === "de";

  let title = "AirDex - Civil Aviation Encyclopedia & Radar Telemetry";
  let description = "Explore the comprehensive civil aviation encyclopedia. Track operational telemetry, search dynamic fleets, and compare aircraft details.";

  if (isIt) {
    title = "AirDex - Enciclopedia dell'Aviazione Civile & Telemetria Radar";
    description = "Esplora l'enciclopedia dell'aviazione civile. Monitora le telemetrie operative, ricerca le flotte commerciali e confronta le specifiche degli aerei.";
  } else if (isEs) {
    title = "AirDex - Enciclopedia de la Aviación Civil y Telemetría Radar";
    description = "Explore la enciclopedia de aviación civil. Monitoree las telemetrías operativas, busque flotas comerciales y compare las especificaciones de los aviones.";
  } else if (isFr) {
    title = "AirDex - Encyclopédie de l'Aviation Civile & Télémétrie Radar";
    description = "Explorez l'encyclopédie de l'aviation civile. Surveillez les télémétries opérationnelles, recherchez les flottes commerciales et comparez les spécifications des avions.";
  } else if (isDe) {
    title = "AirDex - Zivilluftfahrt-Enzyklopädie & Radartelemetrie";
    description = "Erforschen Sie die umfassende Zivilluftfahrt-Enzyklopädie. Verfolgen Sie die Betriebstelemetrie, durchsuchen Sie die Flotten und vergleichen Sie Flugzeugspezifikationen.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.airdex.org/${lang}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.airdex.org/${lang}`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://www.airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Hangar Portal",
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.airdex.org/images/seo-banner.jpg"],
    }
  };
}

export const revalidate = 60; // Sincronizzazione automatica cache DB ogni 60 secondi

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // 1. Estrazione parallela dal Cockpit di Supabase
  const [
    { data: recentNews },
    { data: featuredCandidatesData },
    { count: totalCount },
    { count: activeCount },
    { count: legendaryCount },
    { data: searchIndexData }, // <-- 6a Query: Recupera i dati minimi per l'indice di ricerca
    { data: exploreAircraftData } // <-- 7a Query: Recupera modelli per la sezione di esplorazione
  ] = await Promise.all([
    // Ultime 3 news pubblicate
    supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),
    // Aereo del Giorno: Otteniamo tutti gli ID idonei per una selezione deterministica basata sulla data
    supabase
      .from("aircraft_models")
      .select("id")
      .not("house_livery_url", "is", null)
      .not("house_livery_url", "eq", "")
      .not("house_livery_url", "eq", "NOT_FOUND_WIKI"),
    // Statistiche generali per i contatori di telemetria
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }),
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("aircraft_models").select("*", { count: "exact", head: true }).eq("rarity", "LEGENDARY"),
    // Index di ricerca: Scarica solo i dati necessari a fare il filtro istantaneo lato client
    supabase.from("aircraft_models").select("id, model_name, slug, manufacturers(name)"),
    // Modelli aerei con foto per la sezione Esplora (pool più grande per scelta deterministica giornaliera)
    supabase
      .from("aircraft_models")
      .select(`*, manufacturers (*)`)
      .not("house_livery_url", "is", null)
      .not("house_livery_url", "eq", "")
      .not("house_livery_url", "eq", "NOT_FOUND_WIKI")
      .limit(80)
  ]);

  const recentNewsList = recentNews || [];
  
  // Aereo del Giorno deterministico che cambia ogni giorno:
  const featuredCandidates = featuredCandidatesData || [];
  let aereoDelGiorno: AircraftModel | null = null;
  
  if (featuredCandidates.length > 0) {
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / 86400000);
    const dailyIndex = daysSinceEpoch % featuredCandidates.length;
    const dailyId = featuredCandidates[dailyIndex].id;
    
    // Fetch full data for the daily plane
    const { data: dailyPlane } = await supabase
      .from("aircraft_models")
      .select(`*, manufacturers (*)`)
      .eq("id", dailyId)
      .single();
    aereoDelGiorno = dailyPlane as unknown as AircraftModel;
  }

  // Formattiamo i dati della sesta query in un array pulito per l'autocomplete
  const searchIndex = (searchIndexData as unknown as Array<{ id: string; model_name: string; slug: string; manufacturers: { name: string } | null }>)?.map(item => ({
    id: item.id,
    model_name: item.model_name,
    manufacturer: item.manufacturers?.name || "Sconosciuto",
    slug: item.slug
  })) || [];

  // Calcolo dati storici
  const totale = totalCount || 0;
  const attivi = activeCount || 0;
  const storici = totale - attivi;

  // Gestione dinamica dei colori per l'Aereo del Giorno
  const rarityColorsText: Record<string, string> = {
    COMMON: 'text-slate-400',
    UNCOMMON: 'text-green-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-amber-400',
  };

  const rarityBorders: Record<string, string> = {
    COMMON: 'border-slate-800 hover:border-slate-700',
    UNCOMMON: 'border-green-950/80 hover:border-green-500/50',
    RARE: 'border-blue-950/80 hover:border-blue-500/50',
    EPIC: 'border-purple-950/80 hover:border-purple-500/50',
    LEGENDARY: 'border-amber-950/80 hover:border-amber-550 hover:shadow-[0_0_35px_rgba(245,158,11,0.1)]',
  };

  const rarityGlows: Record<string, string> = {
    COMMON: 'bg-slate-500/5',
    UNCOMMON: 'bg-emerald-500/10',
    RARE: 'bg-blue-500/10',
    EPIC: 'bg-purple-500/10',
    LEGENDARY: 'bg-amber-500/10',
  };

  const rarityTextColor = aereoDelGiorno?.rarity && rarityColorsText[aereoDelGiorno.rarity]
    ? rarityColorsText[aereoDelGiorno.rarity]
    : 'text-slate-300';

  const featuredBorder = aereoDelGiorno?.rarity && rarityBorders[aereoDelGiorno.rarity]
    ? rarityBorders[aereoDelGiorno.rarity]
    : 'border-slate-800';

  const featuredGlow = aereoDelGiorno?.rarity && rarityGlows[aereoDelGiorno.rarity]
    ? rarityGlows[aereoDelGiorno.rarity]
    : 'bg-cyan-500/10';

  // Seeded deterministic random explore list (3 elements, changes daily)
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const todayDate = new Date();
  const daysSinceEpochDate = Math.floor(todayDate.getTime() / 86400000);

  const exploreAircraftList = (exploreAircraftData || [])
    .map((item, index) => {
      const itemSeed = daysSinceEpochDate + index;
      return { item, rand: seededRandom(itemSeed) };
    })
    .sort((a, b) => a.rand - b.rand)
    .map(x => x.item)
    .slice(0, 3) as unknown as AircraftModel[];

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
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="text-cyan-400 font-mono text-xs uppercase tracking-[0.25em] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#22d3ee]"></span>
            Sincronizzazione Avionica Globale Attiva
          </span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight mb-6">
          AirDex Main Core
        </h1>
        <p className="text-slate-300 font-sans text-lg md:text-xl max-w-2xl mx-auto tracking-wide mb-12 leading-relaxed">
          L&apos;enciclopedia definitiva e il registro di telemetria per l&apos;aviazione civile mondiale.
        </p>
        
        {/* BARRA DI RICERCA PREDITTIVA */}
        <SearchAutocomplete lang={lang} searchIndex={searchIndex} />

        {/* TELEMETRIA DASHBOARD (STATISTICHE AVANZATE - LARGHEZZA 7XL ALLINEATA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl relative mt-16">
          {[
            { label: "Vettori in Archivio", value: totale, sub: "OPERA OMNIA", color: "text-white", border: "border-slate-800 bg-slate-900/90" },
            { label: "Servizio di Linea Attivo", value: attivi, sub: "IN AIRSPACE NOW", color: "text-emerald-400", border: "border-slate-800 bg-slate-900/90" },
            { label: "Flotta Storica Ritirata", value: storici, sub: "CHRONO REPOSITORY", color: "text-amber-500", border: "border-slate-800 bg-slate-900/90" },
            { label: "Classe Leggendaria", value: legendaryCount || 0, color: "text-purple-400", sub: "MAX RARITY TIER", border: "border-slate-800 bg-slate-900/90" }
          ].map((stat, i) => (
            <div key={i} className={`border rounded-2xl p-5 md:p-8 backdrop-blur-xl hover:border-cyan-500/70 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all group/stat relative overflow-hidden shadow-lg ${stat.border}`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800 group-hover/stat:bg-cyan-500 transition-colors"></div>
              <span className={`text-4xl font-black font-mono block tracking-tight ${stat.color}`}>{stat.value.toLocaleString()}</span>
              <span className="text-slate-300 text-sm font-extrabold block mt-2.5 uppercase tracking-wide font-sans">{stat.label}</span>
              <span className="text-xs font-mono text-slate-500 tracking-wider block mt-1">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------ SEZIONE: AEREO DEL GIORNO ------------------ */}
      {aereoDelGiorno && (
        <section className="relative z-10 px-4 max-w-7xl mx-auto py-16 animate-fade-in">
          <div className={`bg-slate-900/90 border rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group transition-all duration-300 ${featuredBorder}`}>
            {/* Spot sfumato olografico per rarità */}
            <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-all duration-500 pointer-events-none z-0 ${featuredGlow}`}></div>
            
            {/* Corner Indicators stile HUD aeronautico */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Testo dell'aereo del giorno */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-cyan-550 font-sans text-xs uppercase tracking-[0.25em] font-black block mb-2">
                    {"// DAILY FLIGHT PLAN FEATURED"}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                    {aereoDelGiorno.model_name}
                  </h2>
                  <p className="text-xl text-slate-400 font-medium mt-1">
                    {aereoDelGiorno.manufacturers?.name}
                  </p>
                </div>

                <div className="p-6 bg-slate-950/90 border border-slate-850 rounded-2xl font-sans text-sm space-y-3.5 text-slate-300 font-semibold shadow-inner">
                  <div className="flex justify-between"><span className="text-slate-450 uppercase text-xs font-bold tracking-wider">Propulsione</span> <span className="text-white font-black font-mono">{aereoDelGiorno.engines}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450 uppercase text-xs font-bold tracking-wider">Status Operativo</span> <span className={aereoDelGiorno.status === 'ACTIVE' ? 'text-emerald-400 font-extrabold font-mono text-xs' : 'text-amber-500 font-extrabold font-mono text-xs'}>{aereoDelGiorno.status}</span></div>
                  <div className="flex justify-between"><span className="text-slate-450 uppercase text-xs font-bold tracking-wider">Indice di Rarità</span> <span className={`${rarityTextColor} font-black font-mono text-xs`}>{aereoDelGiorno.rarity}</span></div>
                </div>

                {/* Grafici statistici live per gli appassionati */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-mono text-slate-350 mb-1 font-bold">
                      <span>RAGGIO D&apos;AZIONE MASSIMO</span>
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
                  <Link href={`/${lang}/aircraft/${aereoDelGiorno.slug}`} className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-colors w-full md:w-auto">
                    Apri Scheda Telemetrica Completa &rarr;
                  </Link>
                </div>
              </div>

              {/* Immagine 16:9 con vetrata olografica */}
              <div className="lg:col-span-7 w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-2xl">
                {aereoDelGiorno.house_livery_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image 
                    src={aereoDelGiorno.house_livery_url} 
                    alt={aereoDelGiorno.model_name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 font-mono text-sm tracking-widest bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:30px_30px] font-bold">
                    <svg className="w-12 h-12 text-slate-700 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.543V10a5 5 0 00-5-5H3.581m0 0a23.99 23.99 0 0113.179-1.247M6 11h.01M9 16H5.113a2 2 0 00-1.997 1.851l-.112 1.343" />
                    </svg>
                    FOTO SATELLITARE ATTESA UPGRADE
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 font-mono text-xs text-cyan-400 px-3 py-1.5 rounded-md tracking-wider uppercase font-bold shadow-md">
                  FIRST FLIGHT: {aereoDelGiorno.first_flight_year || 'N/D'}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ------------------ SEZIONE: HANGAR DI ESPLORAZIONE ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-6 bg-cyan-500 rounded"></span>
            Hangar di Esplorazione
          </h2>
          <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-wider">
            Scopri una selezione casuale della nostra flotta. Clicca su una scheda per avviare l&apos;acquisizione dati.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {exploreAircraftList.map((aircraft) => (
            <AircraftCard key={aircraft.id} aircraft={aircraft} lang={lang} />
          ))}
        </div>
      </section>

      {/* ------------------ SEZIONE: NAVIGATORE ERE STORICHE ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-6 bg-cyan-500 rounded"></span>
            Cronologia Vettori per Epoca
          </h2>
          <p className="text-slate-450 font-mono text-xs mt-1 uppercase tracking-wider">Esplorazione filtrata attraverso le grandi rivoluzioni dell&apos;ingegneria aeronautica civili.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "I Pionieri & Elica", era: "1910 - 1945", desc: "Dagli albori in legno e tela ai motori radiali della Seconda Guerra Mondiale.", query: "era=pioneers", badge: "HISTORIC", img: "/images/eras/pioneers_era.jpg" },
            { title: "L'Età dell'Oro a Pistoni", era: "1946 - 1957", desc: "I giganti transoceanici commerciali a pistoni come il DC-6 e il Constellation.", query: "era=golden", badge: "HISTORIC", img: "/images/eras/golden_era.jpg" },
            { title: "L'Avvento del Motore a Getto", era: "1958 - 1999", desc: "La rivoluzione dei Jet. Dal Boeing 707, all'iconico 747 fino al supersonico Concorde.", query: "era=jetage", badge: "ACTIVE_HISTORIC", img: "/images/eras/jet_era.jpg" },
            { title: "Era Moderna & Widebody", era: "2000 - 2026", desc: "I giganti dei cieli in fibra di carbonio ad altissima efficienza energetica: A380, A350, 787.", query: "era=modern", badge: "ACTIVE", img: "/images/eras/modern_era.jpg" },
          ].map((epoch, i) => (
            <Link 
              href={`/${lang}/radar?${epoch.query}`} 
              key={i} 
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/60 hover:bg-slate-900/95 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 group flex flex-col justify-between backdrop-blur-xl shadow-lg overflow-hidden"
            >
              <div>
                {/* Immagine di Epoca con sovrapposizione olografica */}
                <div className="h-32 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 relative mb-5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image 
                    src={epoch.img} 
                    alt={epoch.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                </div>

                <div className="flex justify-between items-start mb-3">
                  <span className="text-cyan-400 font-mono text-xs font-black tracking-wider">{epoch.era}</span>
                  <span className="text-[10px] font-mono border border-slate-700/60 text-slate-400 px-2 py-0.5 rounded uppercase font-bold">{epoch.badge}</span>
                </div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wide mb-2.5 group-hover:text-cyan-400 transition-colors font-mono">{epoch.title}</h3>
                <p className="text-slate-350 text-xs font-semibold leading-relaxed font-sans">{epoch.desc}</p>
              </div>
              <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest mt-6 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                Inizializza Scansione &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------ SEZIONE: ECOSISTEMA GLOBALE (COMPAGNIE & AEROPORTI) ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-6 bg-cyan-500 rounded"></span>
            Ecosistema Aeronautico Globale
          </h2>
          <p className="text-slate-450 font-mono text-xs mt-1 uppercase tracking-wider">
            Navigazione circolare tra i registri flotta delle compagnie aeree e le telemetrie degli aeroporti mondiali.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Compagnie */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl relative overflow-hidden group flex flex-col justify-between hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800 group-hover:bg-purple-500 transition-colors"></div>
            <div>
              <span className="text-purple-400 font-mono text-xs uppercase tracking-widest font-black block mb-3">
                {"// REGISTRO OPERATORI DI LINEA"}
              </span>
              <h3 className="text-3xl font-black text-white uppercase tracking-wider mb-4 group-hover:text-purple-450 transition-colors font-mono">
                Compagnie Aeree
              </h3>
              <p className="text-slate-350 text-sm leading-relaxed font-sans mb-6">
                Esplora le schede di dettaglio dei vettori commerciali globali, le statistiche sulle flotte attive e storiche, le rotte coperte e gli specifici modelli di aeromobili operati in tutto il mondo.
              </p>
            </div>
            <Link
              href={`/${lang}/airlines`}
              className="inline-flex items-center justify-center bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 text-purple-400 hover:text-purple-300 font-mono text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer w-full md:w-auto text-center font-bold"
            >
              Apri Registro Compagnie &rarr;
            </Link>
          </div>

          {/* Card Aeroporti */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl relative overflow-hidden group flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800 group-hover:bg-cyan-500 transition-colors"></div>
            <div>
              <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-black block mb-3">
                {"// INFRASTRUTTURE & HUB INTERNAZIONALI"}
              </span>
              <h3 className="text-3xl font-black text-white uppercase tracking-wider mb-4 group-hover:text-cyan-405 transition-colors font-mono">
                Aeroporti Globali
              </h3>
              <p className="text-slate-355 text-sm leading-relaxed font-sans mb-6">
                Analizza le telemetrie infrastrutturali degli aeroporti civili: piste attive, coordinate satellitari, orientamento magnetico, radiofrequenze ATIS/TOWER e bollettini meteo avionici (METAR) live.
              </p>
            </div>
            <Link
              href={`/${lang}/airports`}
              className="inline-flex items-center justify-center bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-900/40 text-cyan-400 hover:text-cyan-300 font-mono text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer w-full md:w-auto text-center font-bold"
            >
              Accedi al Radar Aeroporti &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------ SEZIONE: ULTIME NEWS & APPROFONDIMENTI ------------------ */}
      <section className="relative z-10 px-4 max-w-7xl mx-auto py-12">
        <div className="flex justify-between items-end mb-8 border-b border-slate-900 pb-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1 h-5 bg-cyan-500 rounded"></span>
              Ultime dal Blog & News
            </h2>
            <p className="text-slate-400 font-mono text-xs mt-1">Approfondimenti tecnici, analisi comparative e tracciati di volo.</p>
          </div>
          <Link href={`/${lang}/blog`} className="text-cyan-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-colors group">
            TUTTI GLI ARTICOLI <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* Griglia che ospita i 3 box delle news */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentNewsList.length > 0 ? (
            recentNewsList.map((article: { id: string; slug: string; title: string; content: string; cover_image_url: string | null; published_at: string | null }) => {
              const dateStr = article.published_at 
                ? new Date(article.published_at).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
                : "N/D";
              return (
                <Link 
                  key={article.id}
                  href={`/${lang}/blog/${article.slug}`}
                  className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                >
                  <div>
                    {/* Cover image */}
                    <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
                      {article.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image 
                          src={article.cover_image_url} 
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900/50 flex items-center justify-center text-slate-700 font-mono text-xs uppercase">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    </div>

                    <div className="p-6">
                      <span className="text-slate-500 font-mono text-xs block mb-2">{dateStr}</span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 uppercase font-mono tracking-tight leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-3.5 line-clamp-3 font-sans">
                        {article.content}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                      Leggi Articolo &rarr;
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-slate-500 font-mono text-xs animate-pulse tracking-widest py-10 col-span-full text-center">
              &gt; NESSUN ARTICOLO DISPONIBILE NELL&apos;ARCHIVIO EDITORIALE.
            </p>
          )}
        </div>
      </section>

      <div className="h-10"></div>

    </main>
  );
}