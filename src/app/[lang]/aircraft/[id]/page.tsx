import { supabase } from "@/lib/supabase";
import { AircraftModel } from "@/types"; 
import { notFound } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";

/**
 * 1. SEO - GENERATE METADATA
 * Genera dinamicamente il titolo e la descrizione della pagina per i motori di ricerca.
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string, id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  const { data: aircraft } = await supabase
    .from('aircraft_models')
    .select('model_name, manufacturers(name)')
    .eq('id', id)
    .single();

  if (!aircraft) {
    return { title: "Aircraft Not Found | AirDex" };
  }

  const aircraftName = aircraft.model_name;
  // Forziamo la lettura in modo sicuro ignorando il tipo 'never'
  const manufacturer = (aircraft.manufacturers as any)?.name || 'Aviation';


  return {
    title: `${aircraftName} | ${manufacturer} | AirDex Hangar`,
    description: `Technical specifications, history, and details of the ${aircraftName}. Discover all the data in the AirDex Aviation Hangar.`,
    openGraph: {
      title: `${aircraftName} - Technical Data`,
      description: `Deep dive into the ${aircraftName} specifications and history.`,
    }
  };
}

/**
 * 2. PROGRAMMATIC SEO - GENERATE STATIC PARAMS
 * Comunica a Next.js tutti gli ID degli aerei esistenti per pre-generare le pagine HTML.
 */
export async function generateStaticParams() {
  const { data: aircrafts } = await supabase
    .from('aircraft_models')
    .select('id');

  if (!aircrafts) return [];

  const locales = ['en', 'it', 'es', 'fr'];
  
  // Crea combinazioni [lang]/[id] per ogni aereo e ogni lingua
  return aircrafts.flatMap((aircraft) =>
    locales.map((lang) => ({
      lang: lang,
      id: aircraft.id,
    }))
  );
}

/**
 * 3. PAGE COMPONENT
 * Il componente principale che renderizza la scheda tecnica dell'aereo.
 */
export default async function AircraftPage({ 
  params 
}: { 
  params: Promise<{ lang: string, id: string }> 
}) {
  const { lang, id } = await params;

  // Abilita il rendering statico per next-intl
  setRequestLocale(lang);

  // Query: prendiamo il modello specifico E i dati del suo costruttore
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*, manufacturers(*)') 
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const aircraft = data as unknown as AircraftModel;

  // Strategia Immagini: Fallback gerarchico
  const imageUrl = aircraft.house_livery_url || aircraft.launch_customer_livery_url;

  // Status Badge Colors
  const isHistoric = aircraft.status === 'HISTORIC';
  const statusColor = isHistoric 
    ? 'text-amber-500/80 border-amber-900/50 bg-amber-950/30' 
    : 'text-emerald-500/80 border-emerald-900/50 bg-emerald-950/30';

  // Rarity Colors (Sci-Fi Hologram)
  const rarityColors: Record<string, string> = {
    COMMON: 'text-slate-300 border-slate-500 bg-slate-900/50 shadow-[0_0_15px_rgba(148,163,184,0.2)]',
    UNCOMMON: 'text-green-400 border-green-700 bg-green-950/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    RARE: 'text-blue-400 border-blue-700 bg-blue-950/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    EPIC: 'text-purple-400 border-purple-700 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    LEGENDARY: 'text-amber-400 border-amber-700 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  };
  
  const rarityStyle = aircraft.rarity && rarityColors[aircraft.rarity] 
    ? rarityColors[aircraft.rarity] 
    : 'text-cyan-400 border-cyan-700 bg-cyan-950/30';

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-2xl border border-slate-800">
        
        {/* Header Sezione */}
        <div className="flex flex-col md:flex-row md:justify-between items-start mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{aircraft.model_name}</h1>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-lg">
              {aircraft.manufacturers?.name || 'Costruttore Sconosciuto'}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 md:justify-end">
            
            {/* Rarity Badge */}
            {aircraft.rarity && (
              <span className={`text-xs font-black px-3 py-1.5 rounded uppercase tracking-widest border ${rarityStyle}`}>
                {aircraft.rarity}
              </span>
            )}
            
            {/* Era Badge */}
            {aircraft.era && (
              <span className="text-xs font-black px-3 py-1.5 rounded uppercase tracking-widest border border-indigo-500/50 bg-indigo-950/30 text-indigo-400">
                {aircraft.era.replace(/_/g, ' ')}
              </span>
            )}

            <span className="text-xs font-black px-3 py-1.5 rounded uppercase tracking-widest border bg-slate-800/80 border-slate-600 text-slate-300">
              {aircraft.type || 'N/A'}
            </span>
            
            {aircraft.status && (
              <span className={`text-xs font-black px-3 py-1.5 rounded uppercase tracking-widest border ${statusColor}`}>
                {aircraft.status}
              </span>
            )}
          </div>
        </div>

        {/* Immagine con Fallback Olografico Sci-Fi */}
        <div className="w-full h-64 md:h-[400px] bg-cyan-950/10 rounded-xl mb-10 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)] group">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt={`Livery ${aircraft.model_name}`} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-20 pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:15px_15px] opacity-60" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-600/70 mb-4 animate-pulse z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="z-10 flex flex-col items-center text-center">
                <span className="text-cyan-400 font-mono text-xs md:text-sm font-bold tracking-[0.2em] bg-slate-900/50 px-3 py-1 rounded">
                  NO VISUAL DATA
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Descrizione Storica AI */}
        {aircraft.description && (
          <div className="mb-10 bg-slate-950/50 rounded-xl p-6 md:p-8 border border-slate-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-cyan-500 font-mono text-sm uppercase tracking-[0.3em] mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Archivio Storico Classificato
            </h3>
            <p className="text-slate-300 leading-relaxed font-sans text-lg whitespace-pre-wrap">
              {aircraft.description}
            </p>
          </div>
        )}

        {/* Griglia Dati Tecnici Avanzata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-cyan-800/50 transition-colors">
            <span className="block text-[10px] text-cyan-500 font-mono uppercase tracking-widest mb-1.5">Capienza Max</span>
            <span className="text-xl font-bold text-white">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
          </div>
          
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-cyan-800/50 transition-colors">
            <span className="block text-[10px] text-cyan-500 font-mono uppercase tracking-widest mb-1.5">Primo Volo</span>
            <span className="text-xl font-bold text-white">{aircraft.first_flight_year || 'N/A'}</span>
          </div>
          
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 col-span-2 hover:border-cyan-800/50 transition-colors">
            <span className="block text-[10px] text-cyan-500 font-mono uppercase tracking-widest mb-1.5">Motori / Propulsione</span>
            <span className="text-lg font-bold text-white">{aircraft.engines || 'N/A'}</span>
          </div>
          
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 col-span-2 md:col-span-4 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-900/20 to-transparent pointer-events-none group-hover:from-cyan-900/40 transition-colors" />
            <span className="block text-[10px] text-cyan-500 font-mono uppercase tracking-widest mb-1.5">Autonomia Operativa (Range)</span>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-cyan-300">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()}` : 'N/A'}</span>
              {aircraft.range_km && <span className="text-cyan-600 font-bold mb-1">km</span>}
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
}