"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import AirlineLogo from "@/components/AirlineLogo";

// Helper per convertire il nome esteso nel codice ISO a 2 lettere per le bandiere.
// Se una nazione non è in lista, userà la bandiera dell'ONU ('un') come elegante fallback.
function getCountryIsoCode(country: string): string {
  if (!country) return "un";
  const normalized = country.toLowerCase().trim();
  const map: Record<string, string> = {
    "united states": "us", "usa": "us",
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
    "turkey": "tr",
    "south korea": "kr",
  };
  return map[normalized] || "un"; 
}

interface AirportDetail {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  runways_count: number;
  elevation_ft: number;
  website: string | null;
  annual_passengers_mio: number | null;
  terminals_count: number;
  cargo_hub_capacity_tons: number | null;
  atis_frequency: string | null;
  tower_frequency: string | null;
  history: string | null;
  main_alliances: string | null;
  total_gates: number | null;
  runway_details: string | null;
  ground_services_json: {
    radar?: string;
    fuel_supply?: string;
    catering_hubs?: number;
    de_icing_stations?: number;
  } | null;
}

interface HubAirline {
  hub_type: string;
  airlines: {
    id: string;
    name: string;
    iata_code: string;
    website: string | null;
    logo_url: string | null;
  };
}

export default function AirportDetailPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const unwrappedParams = React.use(params);
  const lang = unwrappedParams.lang;
  const id = unwrappedParams.id;

  const [airport, setAirport] = useState<AirportDetail | null>(null);
  const [hubAirlines, setHubAirlines] = useState<HubAirline[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"overview" | "airlines" | "history">("overview");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAirportData = async () => {
      const { data: airportData } = await supabase.from("airports").select("*").eq("id", id).single();
      const { data: hubsData } = await supabase
        .from("airline_hubs")
        .select(`hub_type, airlines ( id, name, iata_code, website, logo_url )`)
        .eq("airport_id", id);

      if (airportData) setAirport(airportData as AirportDetail);
      if (hubsData) setHubAirlines(hubsData as unknown as HubAirline[]);
      setLoading(false);
    };
    fetchAirportData();
  }, [supabase, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-emerald-500 border-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!airport) return <div className="min-h-screen bg-[#050505] text-red-500 flex items-center justify-center">Terminale non trovato.</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* 1. TOP BAR */}
      <div className="border-b border-slate-900 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href={`/${lang}/airports`} className="text-xs font-semibold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-2 w-max">
            &larr; Ritorna al Radar Aeroporti
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* 2. HEADER: TITOLO E BADGE CON BANDIERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest">Terminale Logistico</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none">
              {airport.name}
            </h1>
            <p className="text-slate-400 text-sm flex flex-wrap items-center gap-2 font-medium">
              <span>📍 {airport.city}, {airport.country}</span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="font-mono text-xs">{airport.latitude}°N, {airport.longitude}°E</span>
            </p>
          </div>

          {/* ZONA BADGE: Bandiera + IATA + ICAO */}
          <div className="flex gap-3 shrink-0 relative z-40">
            
            {/* BADGE NAZIONE CON TOOLTIP ANIMATO */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl px-5 py-4 flex flex-col items-center justify-center shadow-lg relative group cursor-pointer hover:border-emerald-500/50 transition-colors">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-widest">Nazione</span>
              
              {/* Contenitore Immagine Bandiera */}
              <div className="w-10 h-7 rounded shadow-sm border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://flagcdn.com/${getCountryIsoCode(airport.country)}.svg`} 
                  alt={airport.country}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* TOOLTIP TAILWIND (Appare dolcemente in hover sopra la bandiera) */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl transform translate-y-2 group-hover:translate-y-0 z-50 flex items-center gap-2">
                {airport.country}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-emerald-500/30 transform rotate-45"></div>
              </div>
            </div>

            {/* Badge IATA */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl px-6 py-4 text-center shadow-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-widest">IATA</span>
              <span className="text-emerald-400 font-black text-3xl tracking-wider block leading-none">{airport.iata_code}</span>
            </div>
            
            {/* Badge ICAO */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl px-6 py-4 text-center shadow-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-widest">ICAO</span>
              <span className="text-slate-300 font-black text-3xl tracking-wider block leading-none">{airport.icao_code}</span>
            </div>
          </div>
        </div>

        {/* 3. LAYOUT ASSOLUTO A PERCENTUALI (INDISTRUTTIBILE) */}
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          
          {/* ================= AREA SINISTRA: LARGHEZZA FISSA 66% ================= */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            
            {/* TABS (Con flex-wrap per non accavallarsi mai) */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-b border-slate-800/80">
              {[
                { id: "overview", label: "Dashboard Generale" },
                { id: "airlines", label: `Compagnie Associate (${hubAirlines.length})` },
                { id: "history", label: "Storia & Profilo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-sm font-bold transition-all relative ${
                    activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* CONTENUTI TAB */}
            <div className="animate-fadeIn w-full">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  
                  {/* Card Flussi */}
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 flex flex-col gap-8 overflow-hidden">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/60 pb-3">Capacità Flussi</h3>
                    
                    <div className="w-full">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Passeggeri Annui</span>
                      <span className="font-mono text-3xl text-emerald-400 font-black block mb-3">{airport.annual_passengers_mio ? `${airport.annual_passengers_mio} Mln` : "N/D"}</span>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${airport.annual_passengers_mio ? Math.min(100, (airport.annual_passengers_mio / 110) * 100) : 0}%` }}></div>
                      </div>
                    </div>

                    <div className="w-full">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Logistica Cargo</span>
                      <span className="font-mono text-3xl text-cyan-400 font-black block mb-3">{airport.cargo_hub_capacity_tons ? `${(airport.cargo_hub_capacity_tons / 1000000).toFixed(1)} Mln Tons` : "N/D"}</span>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${airport.cargo_hub_capacity_tons ? Math.min(100, (airport.cargo_hub_capacity_tons / 3500000) * 100) : 0}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Ground Services */}
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 overflow-hidden flex flex-col">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-slate-800/60 pb-3">Servizi Ground</h3>
                    <ul className="space-y-6 flex-1">
                      <li className="w-full">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Radar Avionica</span>
                        <span className="text-base text-white font-bold block truncate">{airport.ground_services_json?.radar || "Operativo (Standard)"}</span>
                      </li>
                      <li className="w-full">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Rifornimento Fuel</span>
                        <span className="text-base text-emerald-400 font-bold block truncate">{airport.ground_services_json?.fuel_supply || "Disponibilità Massima"}</span>
                      </li>
                      <li className="w-full">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Alleanza Principale Hub</span>
                        <span className="text-base text-white font-bold block truncate">{airport.main_alliances || "Indipendente / Mista"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: COMPAGNIE */}
              {activeTab === "airlines" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {hubAirlines.length > 0 ? (
                    hubAirlines.map((item, index) => {
                      const airline = item.airlines;
                      if (!airline) return null;
                      const logoSrc = airline.logo_url || (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

                      return (
                        <Link key={index} href={`/${lang}/airlines/${airline.id}`} className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all group overflow-hidden">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shrink-0 shadow-sm">
                              <AirlineLogo src={logoSrc} alt={airline.name} airlineName={airline.name} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-emerald-400 transition-colors">{airline.name}</h3>
                              <span className="text-xs text-slate-500 font-mono block mt-0.5">{airline.iata_code}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-slate-950 border border-slate-800/60 text-slate-400 shrink-0 ml-3">
                            {item.hub_type}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-1 sm:col-span-2 py-16 text-center text-sm font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                      Nessun vettore commerciale registrato come Hub in questo scalo.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STORIA */}
              {activeTab === "history" && (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 shadow-sm w-full">
                  <p className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-line text-justify break-words">
                    {airport.history || "Nessun dato storico archiviato per questa infrastruttura."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================= AREA DESTRA: LARGHEZZA FISSA 33% ================= */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-24">
            
            {/* Box Infrastruttura */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800/60 pb-3">Infrastruttura Scalo</h3>
              
              <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/40 flex flex-col justify-center overflow-hidden">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Piste</span>
                  <span className="text-xl font-black text-white leading-none">{airport.runways_count}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/40 flex flex-col justify-center overflow-hidden">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Gates</span>
                  <span className="text-xl font-black text-white leading-none">{airport.total_gates || "-"}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/40 flex flex-col justify-center overflow-hidden">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Elev</span>
                  <span className="text-xl font-black text-emerald-400 leading-none">{airport.elevation_ft}</span>
                </div>
              </div>

              <div className="w-full">
                <span className="text-[10px] text-slate-500 block font-bold mb-2 uppercase tracking-widest">Dettagli Geometria Piste</span>
                <p className="text-[11px] text-slate-400 font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800/40 break-words whitespace-pre-wrap leading-relaxed w-full">
                  {airport.runway_details || "Nessun orientamento magnetico registrato."}
                </p>
              </div>
            </div>

            {/* Box Frequenze Radio */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6 border-b border-slate-800/60 pb-3 flex justify-between items-center">
                Frequenze COM
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </h3>
              <div className="flex flex-col gap-4 font-mono text-sm w-full">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/50 w-full gap-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Torre (TWR)</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 truncate">{airport.tower_frequency || "118.100 MHz"}</span>
                </div>
                <div className="flex justify-between items-center w-full gap-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">ATIS Info</span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20 truncate">{airport.atis_frequency || "132.450 MHz"}</span>
                </div>
              </div>
            </div>

            {/* Box Meteo Avionico */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800/60 pb-3">Bollettino Meteo</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6 w-full">
                <div className="w-full">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Vento</span>
                  <span className="font-mono font-bold text-white text-sm block truncate">240° / 12 KT</span>
                </div>
                <div className="w-full">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Visibilità</span>
                  <span className="font-mono font-bold text-white text-sm block truncate">&gt; 10 km</span>
                </div>
                <div className="w-full">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">Copertura</span>
                  <span className="font-mono font-bold text-white text-sm block truncate">BKN 3500ft</span>
                </div>
                <div className="w-full">
                  <span className="text-[10px] text-slate-500 block font-bold mb-1 uppercase tracking-widest">QNH Baro</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm block truncate">1015 hPa</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 w-full flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stringa METAR Effettiva</span>
                <code className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/40 break-words whitespace-pre-wrap leading-relaxed w-full block">
                  {airport.icao_code} 171100Z 24012KT 9999 BKN035 19/11 Q1015 NOSIG
                </code>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}