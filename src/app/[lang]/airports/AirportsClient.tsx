"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCountryIsoCode } from "@/lib/country";
import { getSanitizedPassengers } from "@/lib/airport-pax";

interface Airport {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  runways_count: number;
  elevation_ft: number;
  annual_passengers_mio?: number | null;
  image_url?: string | null;
  slug: string;
}

const getAirportFallbackImage = (airport: { name?: string | null; runways_count?: number | null; elevation_ft?: number | null; country?: string | null }) => {
  const name = (airport.name || "").toLowerCase();
  const country = (airport.country || "").toLowerCase();
  const runways = airport.runways_count || 1;
  const elevation = airport.elevation_ft || 0;

  // 1. Coastal / Island airports
  const islandKeywords = ["maldives", "seychelles", "hawaii", "caribbean", "bahamas", "bora bora", "tahiti", "fiji", "ibiza", "palma", "malta", "aranuka", "agaun", "island", "isola", "islas", "kiribati"];
  if (islandKeywords.some(kw => name.includes(kw) || country.includes(kw))) {
    return "/images/airports/coastal_airport.jpg";
  }

  // 2. High Altitude / Mountain airports
  if (elevation > 5000 || name.includes("mountain") || name.includes("alpi") || name.includes("nepal") || name.includes("kathmandu") || name.includes("quiché") || name.includes("andes") || name.includes("lhasa") || name.includes("bisha")) {
    return "/images/airports/mountain_airport.jpg";
  }

  // 3. Small general aviation / remote airstrips
  if (runways === 1 && !name.includes("internazionale") && !name.includes("international")) {
    return "/images/airports/remote_airstrip.jpg";
  }

  // 4. Large international hubs
  if (runways >= 2 || name.includes("internazionale") || name.includes("international") || name.includes("hub") || name.includes("los angeles") || name.includes("lione") || name.includes("saint exupéry")) {
    return "/images/airports/airport_hub_large.jpg";
  }

  // 5. Default regional
  return "/images/airports/regional_airport.jpg";
};

function AirportCardImage({ airport, fallbackSrc }: { airport: Airport; fallbackSrc: string }) {
  const [imageSrc, setImageSrc] = useState(
    airport.image_url && airport.image_url !== 'NOT_FOUND' && airport.image_url !== 'NOT_FOUND_WIKI' && airport.image_url.trim() !== ''
      ? airport.image_url
      : fallbackSrc
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(
      airport.image_url && airport.image_url !== 'NOT_FOUND' && airport.image_url !== 'NOT_FOUND_WIKI' && airport.image_url.trim() !== ''
        ? airport.image_url
        : fallbackSrc
    );
    setHasError(false);
  }, [airport.image_url, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={`Veduta aerea dello scalo di ${airport.city || ''} - ${airport.name} (${airport.iata_code || ''}/${airport.icao_code || ''})`}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImageSrc(fallbackSrc);
        }
      }}
    />
  );
}

export default function AirportsClient({ 
  initialAirports, 
  lang 
}: { 
  initialAirports: Airport[]; 
  lang: string;
}) {
  // Stati dei filtri
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [runwayFilter, setRunwayFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "city" | "runways" | "passengers">("city");
  
  // Paging client-side
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset del contatore paging quando cambiano i filtri
  useEffect(() => {
    setVisibleCount(12);
  }, [search, selectedCountry, runwayFilter, sortBy]);

  // Statistiche globali calcolate live
  const stats = useMemo(() => {
    if (initialAirports.length === 0) return { total: 0, countries: 0, avgElevation: 0 };
    const countries = new Set(initialAirports.map(a => a.country).filter(Boolean));
    const totalElev = initialAirports.reduce((acc, a) => acc + (a.elevation_ft || 0), 0);
    return {
      total: initialAirports.length,
      countries: countries.size,
      avgElevation: Math.round(totalElev / initialAirports.length)
    };
  }, [initialAirports]);

  // Elenco unico delle nazioni caricate per il filtro dropdown
  const countriesList = useMemo(() => {
    const list = Array.from(new Set(initialAirports.map(a => a.country).filter(Boolean)));
    return list.sort();
  }, [initialAirports]);

  const filteredAndSortedAirports = useMemo(() => {
    const sanitized = initialAirports.map(airport => ({
      ...airport,
      annual_passengers_mio: getSanitizedPassengers(
        airport.iata_code,
        airport.name,
        airport.runways_count,
        airport.annual_passengers_mio || null
      )
    }));

    const result = sanitized.filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.city.toLowerCase().includes(search.toLowerCase()) ||
        a.iata_code.toLowerCase().includes(search.toLowerCase()) ||
        a.icao_code.toLowerCase().includes(search.toLowerCase());

      const matchesCountry = selectedCountry === "ALL" || a.country === selectedCountry;

      let matchesRunway = true;
      if (runwayFilter !== "ALL") {
        if (runwayFilter === "1") matchesRunway = a.runways_count === 1;
        else if (runwayFilter === "2") matchesRunway = a.runways_count === 2;
        else if (runwayFilter === "3") matchesRunway = a.runways_count === 3;
        else if (runwayFilter === "4+") matchesRunway = a.runways_count >= 4;
      }

      return matchesSearch && matchesCountry && matchesRunway;
    });

    return result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "city") return a.city.localeCompare(b.city);
      if (sortBy === "runways") return (b.runways_count || 0) - (a.runways_count || 0);
      if (sortBy === "passengers") return (b.annual_passengers_mio || 0) - (a.annual_passengers_mio || 0);
      return 0;
    });
  }, [initialAirports, search, selectedCountry, runwayFilter, sortBy]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white relative overflow-hidden font-sans pb-24">
      {/* Sfondo Griglia Sci-Fi */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[400px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.03),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10">
        
        {/* Intestazione */}
        <div className="mb-10 text-center md:text-left border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(16,185,129,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Aviation Terminal Nodes Active
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none font-mono">
            Terminale Aeroporti
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Esplora gli hub passeggeri commerciali del mondo. Monitora coordinate, altitudini, piste operative e allacciamenti delle alleanze globali.
          </p>
        </div>

        {/* CONTATORI KPI TELEMETRIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-sans">
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-emerald-500 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mb-2 font-mono">Hub Tracciati</span>
            <span className="text-4xl font-extrabold text-white tracking-tight">{stats.total}</span>
          </div>
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-cyan-500 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mb-2 font-mono">Nazioni Raggiune</span>
            <span className="text-4xl font-extrabold text-white tracking-tight">{stats.countries}</span>
          </div>
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-purple-500 shadow-lg hover:-translate-y-1 transition-all duration-300">
            <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mb-2 font-mono">Elevazione Media</span>
            <span className="text-4xl font-extrabold text-white tracking-tight">{stats.avgElevation.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ft ASL</span></span>
          </div>
        </div>

        {/* PANNELLO FILTRI E RICERCA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Ricerca Libera */}
            <div className="md:col-span-2">
              <label className="block text-slate-450 text-xs font-bold mb-2 font-sans uppercase tracking-wider">Ricerca Libera</label>
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca scalo per città, nazione o codici (IATA/ICAO)..."
                className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-855 focus:border-emerald-500 focus:outline-none text-sm transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] placeholder:text-slate-655"
              />
            </div>

            {/* Filtro Paese */}
            <div>
              <label className="block text-slate-450 text-xs font-bold mb-2 font-sans uppercase tracking-wider">Filtro Nazione</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-855 focus:border-emerald-500 focus:outline-none text-sm transition-all cursor-pointer text-slate-300"
              >
                <option value="ALL">Tutte le Nazioni ({countriesList.length})</option>
                {countriesList.map((country, idx) => (
                  <option key={idx} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Filtro Piste */}
            <div>
              <label className="block text-slate-450 text-xs font-bold mb-2 font-sans uppercase tracking-wider">Piste Minime</label>
              <select
                value={runwayFilter}
                onChange={(e) => setRunwayFilter(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-855 focus:border-emerald-500 focus:outline-none text-sm transition-all cursor-pointer text-slate-300"
              >
                <option value="ALL">Qualsiasi configurazione</option>
                <option value="1">Esattamente 1 pista</option>
                <option value="2">Esattamente 2 piste</option>
                <option value="3">Esattamente 3 piste</option>
                <option value="4+">4 o più piste attive</option>
              </select>
            </div>

          </div>

          {/* Ordina per */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-550 uppercase text-xs font-bold font-sans">Ordina Risultati:</span>
              {[
                { id: "city", label: "📍 Città" },
                { id: "name", label: "🏨 Nome" },
                { id: "runways", label: "🛫 Piste" },
                { id: "passengers", label: "👥 Flussi Pax" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSortBy(item.id as "name" | "city" | "runways" | "passengers")}
                  className={`px-3.5 py-2 rounded-lg border text-xs uppercase tracking-wider transition-all ${
                    sortBy === item.id 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" 
                      : "bg-slate-950 border-slate-850 text-slate-450 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-bold font-sans">
              Corrispondenze identificate: <strong className="text-emerald-400">{filteredAndSortedAirports.length}</strong>
            </span>
          </div>
        </div>

        {/* GRIGLIA DEGLI AEROPORTI */}
        {filteredAndSortedAirports.length > 0 ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedAirports.slice(0, visibleCount).map((airport) => {
                return (
                  <div 
                    key={airport.id} 
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:shadow-[0_0_35px_rgba(16,185,129,0.15)] rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between relative"
                  >
                    {/* Spot sfumato olografico */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none z-0"></div>

                    {/* Airport Cover Image */}
                    <div className="h-40 w-full bg-slate-950 relative overflow-hidden flex-shrink-0">
                      <AirportCardImage airport={airport} fallbackSrc={getAirportFallbackImage(airport)} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                      
                      {/* Code Badges & Flag overlapping image */}
                      <div className="absolute top-3.5 right-3.5 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-800 font-mono text-center shadow-lg flex flex-col items-center gap-2 z-10">
                        <div>
                          <span className="text-emerald-400 font-black text-sm tracking-wider block leading-none">{airport.iata_code}</span>
                          <span className="text-slate-455 block text-[11px] uppercase font-black mt-1 leading-none">{airport.icao_code}</span>
                        </div>
                        
                        {/* Bandiera Nazione con Tooltip */}
                        <div className="relative group self-center border-t border-slate-800 pt-1.5 w-full flex justify-center">
                          <div className="w-6 h-4 rounded shadow-sm border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center cursor-help">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={`https://flagcdn.com/${getCountryIsoCode(airport.country)}.svg`} 
                              alt={`Bandiera nazionale del paese ${airport.country}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="pointer-events-none absolute bottom-full mb-2 w-max bg-slate-900 border border-slate-800 text-[10px] uppercase font-mono tracking-widest text-slate-200 px-2 py-1 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                            {airport.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      {/* Header Info */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-extrabold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight uppercase font-mono tracking-tight">
                          {airport.name}
                        </h2>
                        <p className="text-slate-350 text-sm font-semibold uppercase mt-2.5 font-sans">📍 {airport.city}, {airport.country}</p>
                      </div>

                      {/* Stats & Link */}
                      <div>
                        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-850 font-mono text-xs mb-4 text-slate-300 shadow-inner font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-455 font-sans font-bold">🛫 Piste:</span>
                            <strong className="text-white font-black">{airport.runways_count}</strong>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-slate-455 font-sans font-bold">👥 Pax:</span>
                            <strong className="text-emerald-400 font-black">{airport.annual_passengers_mio ? `${airport.annual_passengers_mio}M` : "—"}</strong>
                          </div>
                        </div>

                        <Link 
                          href={`/${lang}/airports/${airport.slug}`}
                          className="w-full py-3.5 rounded-2xl bg-slate-950 border border-slate-850 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 font-mono text-xs uppercase tracking-widest font-black transition-all flex justify-center items-center gap-2 group-hover:bg-slate-900/40 cursor-pointer shadow-sm"
                        >
                          Torre Controllo
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* CARICA ALTRI (PAGING CONTROL) */}
            {filteredAndSortedAirports.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="w-full mt-4 text-emerald-400 hover:text-white border border-emerald-800/80 hover:border-emerald-500 hover:bg-emerald-950/30 p-4 rounded-xl text-xs font-mono uppercase tracking-widest font-black transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] flex justify-center items-center gap-2 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Espandi Registri Aeroportuali (+12 Hubs)
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-slate-900 rounded-3xl p-16 text-center font-mono text-slate-650 text-xs shadow-inner">
            ❌ Nessun hub identificato nei registri di navigazione per i criteri inseriti.
          </div>
        )}

      </div>
    </main>
  );
}
