"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import CaptureButtons from "@/components/CaptureButtons";
import Breadcrumbs from "@/components/Breadcrumbs";

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
  history_it?: string | null;
  history_en?: string | null;
  history_es?: string | null;
  history_fr?: string | null;
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
    slug: string;
    manufacturers: { name: string };
  };
}

export default function AirlineDetailClient({ params }: { params: { lang: string; slug: string } }) {
  const lang = params.lang;
  const slug = params.slug;

  const [airline, setAirline] = useState<AirlineDetail | null>(null);
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [allModels, setAllModels] = useState<{ id: string; model_name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "fleet">("overview");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDeepData = async () => {
      const { data: modelsData } = await supabase.from("aircraft_models").select("id, model_name, slug");
      if (modelsData) setAllModels(modelsData as any[]);

      const { data: airlineData } = await supabase.from("airlines").select("*").eq("slug", slug).single();

      if (airlineData) {
        setAirline(airlineData as AirlineDetail);

        const { data: fleetData } = await supabase
          .from("airline_fleet")
          .select(`
            status, qty,
            aircraft_models (id, model_name, type, rarity, slug, manufacturers ( name ))
          `)
          .eq("airline_id", airlineData.id);

        if (fleetData) setFleet(fleetData as unknown as FleetItem[]);
      }
      setLoading(false);
    };

    fetchDeepData();
  }, [supabase, slug]);

  const findMatchingLink = (val: string): string | null => {
    const cleanVal = val.trim().toLowerCase();
    if (!cleanVal || cleanVal.length < 2) return null;

    // 1. Check aircraft models
    for (const plane of allModels) {
      const pName = plane.model_name.toLowerCase();
      if (cleanVal === pName || (cleanVal.length > 5 && pName.includes(cleanVal)) || (pName.length > 5 && cleanVal.includes(pName))) {
        return `/${lang}/aircraft/${plane.slug}`;
      }
    }

    return null;
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanVal = part.slice(2, -2).trim();
        const matchingLink = findMatchingLink(cleanVal);
        if (matchingLink) {
          return (
            <Link 
              key={idx} 
              href={matchingLink} 
              className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline transition-colors underline-offset-4 decoration-cyan-500/50"
            >
              {cleanVal}
            </Link>
          );
        }
        return <strong key={idx} className="text-cyan-300 font-extrabold">{cleanVal}</strong>;
      }
      return part;
    });
  };

  // MOTORE DI PARSING AUTOMATICO DEL TESTO PER PARAGRAFI E NAVIGAZIONE CIRCOLARE
  const renderLinkedHistoryParagraphs = useMemo(() => {
    const localizedHistory = airline ? ((airline[`history_${lang}` as keyof AirlineDetail] as string | null) || airline.history) : null;
    if (!localizedHistory) return [];

    const lines = localizedHistory.split('\n');
    const result = [];
    let currentParagraphLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('###')) {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
        result.push({
          type: 'heading-3',
          text: line.replace(/^###\s*/, '')
        });
      } else if (line.startsWith('##')) {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
        result.push({
          type: 'heading-2',
          text: line.replace(/^##\s*/, '')
        });
      } else if (line === "") {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
      } else {
        currentParagraphLines.push(line);
      }
    }

    if (currentParagraphLines.length > 0) {
      result.push({
        type: 'paragraph',
        text: currentParagraphLines.join('\n')
      });
    }

    return result;
  }, [airline, lang]);

  if (loading || !airline) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-purple-400 font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
        <span className="tracking-[0.25em] uppercase text-xs animate-pulse">Sintonizzazione Firma Vettore...</span>
      </div>
    );
  }

  const isIt = lang === "it";
  const flag = getCountryIsoCode(airline.country);

  // Calcolo totale velivoli censiti in AirDex
  const fleetAirdexTotal = fleet.reduce((acc, curr) => acc + curr.qty, 0);

  const breadcrumbItems = [
    { label: isIt ? "Vettori" : "Airlines", href: `/${lang}/airlines` },
    { label: airline.name }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Olografia di Sfondo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(168,85,247,0.05),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        <Breadcrumbs items={breadcrumbItems} lang={lang} />

        {/* Navigazione */}
        <div className="mb-8 flex justify-between items-center">
          <Link 
            href={`/${lang}/airlines`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 hover:text-purple-400 border border-slate-900 hover:border-slate-800 bg-slate-950 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer font-mono font-bold"
          >
            &larr; {isIt ? "Registro Vettori" : "Airlines Index"}
          </Link>
          
          <CaptureButtons 
            targetId={airline.id} 
            type="AIRLINE" 
            lang={lang} 
          />
        </div>

        {/* HEADER SCHEDA COMPAGNIA */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-xl">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

          {/* Logo Vettore */}
          <div className="w-28 h-28 bg-slate-950 rounded-2xl border border-slate-850 p-4 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
            {airline.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={airline.logo_url} 
                alt={airline.name}
                className="object-contain max-w-full max-h-full filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              />
            ) : (
              <span className="text-3xl">🏢</span>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          </div>

          {/* Info Principali */}
          <div className="flex-grow text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="font-mono text-xs text-purple-400 tracking-widest uppercase font-black">
                {"// FIRMA OPERATIVA VETTORE"}
              </span>
              {airline.alliance && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950/40 border border-purple-900/50 text-purple-300 font-mono text-[9px] uppercase font-bold tracking-wider">
                  {airline.alliance}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-sans">
              {airline.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://flagcdn.com/16x12/${flag}.png`} 
                  alt={airline.country}
                  className="rounded-sm"
                />
                {airline.country}
              </span>
              <span className="hidden sm:inline opacity-30">•</span>
              <span>IATA: <strong className="text-white font-extrabold">{airline.iata_code || "—"}</strong></span>
              <span className="hidden sm:inline opacity-30">•</span>
              <span>ICAO: <strong className="text-white font-extrabold">{airline.icao_code || "—"}</strong></span>
              {airline.callsign && (
                <>
                  <span className="hidden sm:inline opacity-30">•</span>
                  <span>CALLSIGN: <strong className="text-purple-400 font-extrabold">{airline.callsign}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex bg-slate-900/20 border border-slate-900 p-1.5 rounded-2xl mb-8 font-mono text-xs tracking-widest uppercase relative z-10 w-max max-w-full">
          {[
            { id: "overview", label: isIt ? "Panoramica" : "Overview" },
            { id: "history", label: isIt ? "Storia & Profilo" : "History & Profile" },
            { id: "fleet", label: isIt ? "Flotta AirDex" : "AirDex Fleet" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl transition-all cursor-pointer font-bold ${
                activeTab === tab.id 
                  ? "bg-purple-950/40 text-purple-300 border border-purple-900/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENUTO TAB */}
        <div className="relative z-10">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Box Info Tecniche */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                  <span>📊</span> {isIt ? "TELEMETRIA AZIENDALE" : "CARRIER TELEMETRY"}
                </h3>
                
                <div className="grid grid-cols-2 gap-6 font-mono text-xs">
                  <div className="bg-slate-950/50 border border-slate-900 p-4.5 rounded-xl shadow-inner">
                    <span className="text-slate-500 block uppercase mb-1">Stato Operativo</span>
                    <span className={`font-black uppercase flex items-center gap-1.5 ${airline.closed_year ? "text-amber-500" : "text-emerald-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${airline.closed_year ? "bg-amber-500 shadow-[0_0_5px_#f59e0b]" : "bg-emerald-400 shadow-[0_0_5px_#34d399]"}`} />
                      {airline.closed_year ? (isIt ? "Ritirata / Chiusa" : "Defunct / Historic") : (isIt ? "Attiva" : "Active")}
                    </span>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 p-4.5 rounded-xl shadow-inner">
                    <span className="text-slate-500 block uppercase mb-1">{isIt ? "Anno di Fondazione" : "Founded Year"}</span>
                    <span className="text-white font-extrabold text-base">{airline.founded_year}</span>
                    {airline.closed_year && <span className="text-slate-500 block mt-0.5">Closed: {airline.closed_year}</span>}
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 p-4.5 rounded-xl shadow-inner">
                    <span className="text-slate-500 block uppercase mb-1">{isIt ? "Hub Principale" : "Main Hub"}</span>
                    <span className="text-white font-extrabold text-sm uppercase leading-tight truncate block" title={airline.main_hub || "N/A"}>
                      {airline.main_hub || "—"}
                    </span>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 p-4.5 rounded-xl shadow-inner">
                    <span className="text-slate-500 block uppercase mb-1">{isIt ? "Quartier Generale" : "Headquarters"}</span>
                    <span className="text-white font-extrabold text-sm uppercase leading-tight truncate block" title={airline.headquarters || "N/A"}>
                      {airline.headquarters || "—"}
                    </span>
                  </div>
                </div>

                {/* Slogan */}
                {airline.slogan && (
                  <div className="bg-purple-950/10 border border-purple-900/30 p-5 rounded-2xl text-center">
                    <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase block mb-1">Slogan Vettore</span>
                    <p className="text-slate-200 italic font-sans font-semibold">&ldquo;{airline.slogan}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Box KPI Finanziari / Operativi */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                  <span>💼</span> {isIt ? "METRICHE DI SERVIZIO" : "OPERATIONAL METRICS"}
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-950">
                    <span className="text-slate-505 uppercase">Destinazioni Servite</span>
                    <span className="text-white font-extrabold text-base">{airline.destinations_count || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-950">
                    <span className="text-slate-505 uppercase">{isIt ? "Passeggeri/Anno" : "Passengers/Year"}</span>
                    <span className="text-white font-extrabold text-base">
                      {airline.annual_passengers_mio ? `${airline.annual_passengers_mio} Mln` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-950">
                    <span className="text-slate-505 uppercase">{isIt ? "Fatturato Annuo" : "Annual Revenue"}</span>
                    <span className="text-emerald-400 font-extrabold text-base">
                      {airline.revenue_usd_billion ? `$${airline.revenue_usd_billion} Mld` : "—"}
                    </span>
                  </div>
                  {airline.website && (
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-slate-505 uppercase">Sito Internet</span>
                      <a 
                        href={airline.website.startsWith("http") ? airline.website : `https://${airline.website}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-400 hover:text-cyan-300 font-extrabold hover:underline"
                      >
                        {airline.website.replace(/https?:\/\//, "").replace("www.", "")} &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORIA & PROFILO */}
          {activeTab === "history" && (
            <div className="bg-slate-900/40 border border-slate-900 p-8 md:p-10 rounded-3xl backdrop-blur-md max-w-4xl mx-auto space-y-6 select-text">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>📖</span> {isIt ? "STORIA ED EVOLUZIONE" : "HISTORICAL RECORD"}
              </h3>

              <div className="space-y-6 text-slate-300 text-sm md:text-base leading-relaxed font-sans font-medium">
                {renderLinkedHistoryParagraphs.length > 0 ? (
                  renderLinkedHistoryParagraphs.map((block, idx) => {
                    if (block.type === 'heading-2') {
                      return (
                        <h2 key={idx} className="text-lg font-black text-white font-mono uppercase tracking-wider border-b border-slate-950 pb-2 mt-8 mb-4">
                          {block.text}
                        </h2>
                      );
                    }
                    if (block.type === 'heading-3') {
                      return (
                        <h3 key={idx} className="text-base font-extrabold text-purple-400 font-mono uppercase tracking-wide mt-6 mb-3">
                          {block.text}
                        </h3>
                      );
                    }
                    return (
                      <p key={idx} className="indent-4 md:indent-8">
                        {parseInlineFormatting(block.text)}
                      </p>
                    );
                  })
                ) : (
                  <div className="text-center font-mono text-xs text-slate-500 py-10 uppercase tracking-widest">
                    Nessun registro storico tradotto in archivio.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MATRIX FLOTTA (NAVIGAZIONE CIRCOLARE) */}
          {activeTab === "fleet" && (
            <div>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 mb-6 flex justify-between items-center font-mono text-xs text-slate-400 shadow-inner">
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
                        href={`/${lang}/aircraft/${model.slug}`}
                        className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/65 p-6 rounded-2xl flex items-center justify-between transition-all duration-300 hover:bg-slate-900/80 group shadow-md hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:-translate-y-1 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gradient-to-b group-hover:from-cyan-500 group-hover:to-purple-500 transition-colors"></div>
                        
                        <div>
                          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                            {model.manufacturers?.name}
                          </span>
                          <span className="text-white font-extrabold text-base group-hover:text-cyan-400 transition-colors block mt-0.5">
                            {model.model_name}
                          </span>
                          <span className="text-slate-350 text-xs font-mono block mt-2 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-850 w-max">
                            {model.type || "Commercial Jet"}
                          </span>
                        </div>

                        <div className="text-right font-mono flex flex-col items-end justify-between h-full min-h-[70px]">
                          <span className="text-xs font-black text-cyan-400 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl shadow-inner">
                            x{item.qty}
                          </span>
                          <span className="text-xs uppercase font-extrabold text-purple-400 tracking-wider mt-4 bg-purple-950/30 border border-purple-900/40 px-2.5 py-1 rounded-full">
                            {model.rarity}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-800 bg-slate-900/20 rounded-2xl p-16 text-center text-slate-500 font-mono text-sm shadow-inner">
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
