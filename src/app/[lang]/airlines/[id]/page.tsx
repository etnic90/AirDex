"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import CaptureButtons from "@/components/CaptureButtons";

function getCountryIsoCode(country: string): string {
  if (!country) return "un";
  const normalized = country.toLowerCase().trim();
  const map: Record<string, string> = {
    "united states": "us", "usa": "us", "united states of america": "us",
    "germany": "de",
    "united arab emirates": "ae", "uae": "ae",
    "italy": "it", "italia": "it",
    "france": "fr",
    "united kingdom": "gb", "uk": "gb",
    "spain": "es",
    "japan": "jp",
    "china": "cn",
    "canada": "ca",
    "australia": "au",
    "brazil": "br",
    "india": "in",
    "netherlands": "nl",
    "switzerland": "ch",
    "singapore": "sg",
    "qatar": "qa",
    "turkey": "tr", "turkiye": "tr",
    "south korea": "kr", "korea": "kr",
    "ireland": "ie",
    "finland": "fi",
    "sweden": "se",
    "norway": "no",
    "denmark": "dk",
    "belgium": "be",
    "austria": "at",
    "portugal": "pt",
    "malaysia": "my",
    "thailand": "th",
    "hong kong": "hk",
    "vietnam": "vn",
    "philippines": "ph",
    "new zealand": "nz",
    "egypt": "eg",
    "south africa": "za",
    "mexico": "mx"
  };
  return map[normalized] || "un"; 
}

interface AirlineDetail {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  country: string;
  founded_year: number;
  closed_year: number | null;
  website: string | null;
  callsign: string | null;
  alliance: string | null;
  main_hub: string | null;
  history: string | null;
  slogan: string | null;
  headquarters: string | null;
  destinations_count: number | null;
  annual_passengers_mio: number | null;
  revenue_usd_billion: number | null;
  fleet_total_size: number | null;
  logo_url: string | null;
}

interface FleetItem {
  status: string;
  qty: number;
  aircraft_models: {
    id: string;
    model_name: string;
    type: string;
    rarity: string;
    manufacturers: { name: string };
  };
}

export default function AirlineDetailPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  // UNWRAP DEI PARAMETRI ASINCRONI PER NEXT.JS 15
  const unwrappedParams = React.use(params);
  const lang = unwrappedParams.lang;
  const id = unwrappedParams.id;

  const [airline, setAirline] = useState<AirlineDetail | null>(null);
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [allModels, setAllModels] = useState<{ id: string; model_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "fleet">("overview");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDeepData = async () => {
      const { data: modelsData } = await supabase.from("aircraft_models").select("id, model_name");
      if (modelsData) setAllModels(modelsData);

      const { data: airlineData } = await supabase.from("airlines").select("*").eq("id", id).single();

      const { data: fleetData } = await supabase
        .from("airline_fleet")
        .select(`
          status, qty,
          aircraft_models (id, model_name, type, rarity, manufacturers ( name ))
        `)
        .eq("airline_id", id);

      if (airlineData) setAirline(airlineData as AirlineDetail);
      if (fleetData) setFleet(fleetData as unknown as FleetItem[]);
      setLoading(false);
    };

    fetchDeepData();
  }, [supabase, id]);

  // MOTORE DI PARSING AUTOMATICO DEL TESTO PER PARAGRAFI E NAVIGAZIONE CIRCOLARE
  const renderLinkedHistoryParagraphs = useMemo(() => {
    if (!airline?.history || allModels.length === 0) {
      return airline?.history 
        ? airline.history.split(/\n\s*\n/).map((p, idx) => ({ index: idx, nodes: [p.trim()] }))
        : [];
    }

    const paragraphs = airline.history.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const sortedModels = [...allModels].sort((a, b) => b.model_name.length - a.model_name.length);

    return paragraphs.map((paragraphText, pIdx) => {
      let text = paragraphText;
      const replacements: { placeholder: string; component: React.ReactNode }[] = [];

      sortedModels.forEach((model, index) => {
        const regex = new RegExp(`\\b${model.model_name}\\b`, "gi");
        if (regex.test(text)) {
          const placeholder = `___PLANE_REF_${pIdx}_${index}___`;
          text = text.replace(regex, placeholder);
          replacements.push({
            placeholder,
            component: (
              <Link 
                key={placeholder}
                href={`/${lang}/aircraft/${model.id}`}
                className="text-cyan-400 font-bold border-b border-dashed border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 px-1.5 py-0.5 rounded transition-all font-mono inline-block shadow-[0_0_10px_rgba(6,182,212,0.05)] animate-pulse"
              >
                {model.model_name}
              </Link>
            )
          });
        }
      });

      const parts = text.split(/(___PLANE_REF_\d+_\d+___)/g);
      const nodes = parts.map((part) => {
        const found = replacements.find(r => r.placeholder === part);
        return found ? found.component : part;
      });

      return {
        index: pIdx,
        nodes
      };
    });
  }, [airline, allModels, lang]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-500 flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-slate-800 border-l-slate-800 rounded-full animate-spin"></div>
        <span className="tracking-[0.2em] uppercase text-xs animate-pulse">Sincronizzazione Terminale Vettore...</span>
      </div>
    );
  }

  if (!airline) return <div className="min-h-screen bg-slate-950 text-red-500 flex items-center justify-center font-mono">Errore: Vettore offline.</div>;

  const logoSrc = airline.logo_url 
  ? airline.logo_url 
  : (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

  const fleetAirdexTotal = fleet.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigazione Indietro */}
        <div className="mb-6">
          <Link href={`/${lang}/airlines`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400 border border-slate-900 hover:border-slate-800 bg-slate-950 px-4 py-2 rounded-lg transition-all shadow-md">
            &larr; Chiudi Terminale Vettori
          </Link>
        </div>

        {/* HEADER PLANCIA */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            {/* Contenitore Immagine con Scudo Anti-Errore */}
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center p-3 border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.1)] flex-shrink-0 relative group overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                src={logoSrc || ""} 
                alt={airline.name} 
                className="max-w-full max-h-full object-contain relative z-10"
                onError={(e) => {
                    // Ultima linea di difesa se anche il link di Wikipedia o Clearbit dovesse rompersi
                    (e.target as HTMLImageElement).src = `https://avatar.oxro.io/avatar.svg?name=${encodeURIComponent(airline.name)}&background=0f172a&color=06b6d4`;
                }}
                />
              ) : (
                <span className="text-slate-900 text-3xl font-black relative z-10">{airline.iata_code}</span>
              )}
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1.5">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{airline.name}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className={`text-[10px] font-mono uppercase font-black tracking-widest px-2.5 py-0.5 rounded border self-center ${
                    airline.closed_year ? 'border-amber-500/30 text-amber-500 bg-amber-950/20' : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                  }`}>
                    {airline.closed_year ? 'Historical' : 'Active'}
                  </span>
                  
                  {/* Bandiera Nazione Interattiva con Tooltip */}
                  <div className="relative group inline-flex items-center self-center">
                    <div className="w-7 h-4.5 rounded shadow-sm border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center cursor-help">
                      <img 
                        src={`https://flagcdn.com/${getCountryIsoCode(airline.country)}.svg`} 
                        alt={airline.country}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Tooltip CSS */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-900 border border-slate-800 text-[10px] uppercase font-mono tracking-widest text-slate-200 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-2xl">
                      Stato: {airline.country}
                    </span>
                  </div>
                </div>
              </div>
              {airline.slogan && <p className="text-cyan-400/70 italic text-xs font-mono">“{airline.slogan}”</p>}
              <p className="text-slate-500 font-mono text-xs mt-1">{airline.headquarters || airline.country}</p>
            </div>
          </div>

          <div className="flex gap-4 bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-center shadow-inner">
            <div className="px-3 border-r border-slate-900">
              <span className="text-slate-600 block text-[9px] uppercase tracking-wider">IATA</span>
              <span className="text-cyan-400 font-black text-base">{airline.iata_code || "—"}</span>
            </div>
            <div className="px-3">
              <span className="text-slate-600 block text-[9px] uppercase tracking-wider">ICAO</span>
              <span className="text-purple-400 font-black text-base">{airline.icao_code || "—"}</span>
            </div>
          </div>
        </div>

        {/* Pulsante Registrazione AirDex */}
        <div className="mb-8 w-full max-w-sm">
          <CaptureButtons targetId={id} type="AIRLINE" lang={lang} />
        </div>

        {/* BARRA DEI COMANDI INTERATTIVI */}
        <div className="flex border-b border-slate-900 gap-2 mb-8 overflow-x-auto font-mono text-xs tracking-widest uppercase">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-4 border-b-2 font-bold transition-all ${
              activeTab === "overview" ? "border-cyan-500 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.1)]" : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            📊 Telemetria Operativa
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-4 border-b-2 font-bold transition-all ${
              activeTab === "history" ? "border-cyan-500 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.1)]" : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            📜 Registro Storico
          </button>
          <button 
            onClick={() => setActiveTab("fleet")}
            className={`pb-4 px-4 border-b-2 font-bold transition-all ${
              activeTab === "fleet" ? "border-cyan-500 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.1)]" : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            🛸 Matrice Flotta ({fleet.length})
          </button>
        </div>

        {/* CONTAINER DINAMICO SCHEDE */}
        <div>
          {/* TAB 1: OVERVIEW & PROGRESS BARS */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-5 shadow-lg">
                <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest border-b border-slate-900 pb-2 font-black">
                  Specifiche Profilo
                </h3>
                <div className="flex flex-col gap-4 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500">CALLSIGN RADIO</span>
                    <span className="text-cyan-400 font-bold tracking-widest">{airline.callsign || "UNSPECIFIED"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500">ALLEANZA</span>
                    <span className="text-purple-400 font-bold">{airline.alliance || "Indipendente"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500">ANNO APERTURA</span>
                    <span className="text-white font-bold">{airline.founded_year}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">HUB CENTRALE</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[180px]">{airline.main_hub || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 lg:col-span-2 flex flex-col gap-6 shadow-lg">
                <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest border-b border-slate-900 pb-2 font-black">
                  Analisi Forzata di Mercato (Livello Rete)
                </h3>
                
                <div>
                  <div className="flex justify-between font-mono text-xs mb-2">
                    <span className="text-slate-400">Volume Ricavi Annui (USD)</span>
                    <span className="text-purple-400 font-black">{airline.revenue_usd_billion ? `$ ${airline.revenue_usd_billion} Mld` : "N/A"}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-900 overflow-hidden p-0.5 shadow-inner">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-1000" style={{ width: `${airline.revenue_usd_billion ? Math.min(100, (airline.revenue_usd_billion / 50) * 100) : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-2">
                    <span className="text-slate-400">Passeggeri Trasportati / Anno</span>
                    <span className="text-emerald-400 font-black">{airline.annual_passengers_mio ? `${airline.annual_passengers_mio} Mln` : "N/A"}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-900 overflow-hidden p-0.5 shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${airline.annual_passengers_mio ? Math.min(100, (airline.annual_passengers_mio / 80) * 100) : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-2">
                    <span className="text-slate-400">Scali di Rete Attivi</span>
                    <span className="text-cyan-400 font-black">{airline.destinations_count ? `${airline.destinations_count} Destinazioni` : "N/A"}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-900 overflow-hidden p-0.5 shadow-inner">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-1000" style={{ width: `${airline.destinations_count ? Math.min(100, (airline.destinations_count / 300) * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTRO STORICO CON LINK PARSATI IN BOX DEDICATI */}
          {activeTab === "history" && (
            <div className="flex flex-col gap-6 w-full font-sans">
              {renderLinkedHistoryParagraphs.length > 0 ? (
                renderLinkedHistoryParagraphs.map((paragraph) => (
                  <div 
                    key={paragraph.index}
                    className="bg-slate-900/20 border border-slate-900 hover:border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-3 font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/70"></span>
                      Registro Storico // Sezione {String(paragraph.index + 1).padStart(2, "0")}
                    </div>
                    <div className="text-slate-350 text-sm md:text-base leading-relaxed text-justify whitespace-pre-line">
                      {paragraph.nodes}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-8 text-center text-slate-500 font-mono text-xs shadow-inner">
                  Nessun registro storico registrato per questo vettore.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MATRIX FLOTTA (NAVIGAZIONE CIRCOLARE) */}
          {activeTab === "fleet" && (
            <div>
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 mb-6 flex justify-between items-center font-mono text-xs text-slate-500 shadow-inner">
                <span>VETTORI IN DATABASE: <strong>{fleet.length} MODELLI</strong></span>
                <span>UNITÀ TOTALI REGISTRATE: <strong>{fleetAirdexTotal} VELIVOLI</strong></span>
              </div>

              {fleet.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fleet.map((item) => {
                    const model = item.aircraft_models;
                    return (
                      <Link 
                        key={model.id}
                        href={`/${lang}/aircraft/${model.id}`}
                        className="bg-slate-900/30 border border-slate-900 hover:border-cyan-500/50 p-5 rounded-2xl flex items-center justify-between transition-all duration-300 hover:bg-slate-900/80 group shadow-md hover:shadow-[0_0_25px_rgba(6,182,212,0.1)] hover:-translate-y-1 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gradient-to-b group-hover:from-cyan-500 group-hover:to-purple-500 transition-colors"></div>
                        
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                            {model.manufacturers?.name}
                          </span>
                          <span className="text-white font-black text-sm group-hover:text-cyan-400 transition-colors block mt-0.5">
                            {model.model_name}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono block mt-2 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900 w-max">
                            {model.type || "Commercial Jet"}
                          </span>
                        </div>

                        <div className="text-right font-mono flex flex-col items-end justify-between h-full min-h-[70px]">
                          <span className="text-xs font-black text-cyan-400 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl shadow-inner">
                            x{item.qty}
                          </span>
                          <span className="text-[8px] uppercase font-bold text-purple-400 tracking-widest mt-4 bg-purple-950/20 border border-purple-900/30 px-1.5 py-0.5 rounded">
                            {model.rarity}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-900 bg-slate-900/10 rounded-2xl p-16 text-center text-slate-600 font-mono text-sm shadow-inner">
                  ❌ Nessun aeromobile attualmente collegato alla firma radar di questo vettore.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}