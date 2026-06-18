"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import AirlineLogo from "@/components/AirlineLogo";

interface Airline {
  id: string;
  name: string;
  iata_code: string | null;
  icao_code: string | null;
  country: string;
  founded_year: number;
  closed_year: number | null;
  website: string | null;
  logo_url: string | null;
  callsign: string | null;
  alliance: string | null;
  main_hub: string | null;
  slogan: string | null;
}

export default function AirlinesPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = React.use(params);
  const lang = unwrappedParams.lang;

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtri e Ricerca
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "defunct">("all");
  const [allianceFilter, setAllianceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "founded_asc" | "founded_desc" | "country">("name");
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAirlines = async () => {
      let allAirlines: Airline[] = [];
      let start = 0;
      const size = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("airlines")
          .select("*")
          .order("name", { ascending: true })
          .range(start, start + size - 1);

        if (error) {
          console.error("Errore nel recupero delle compagnie:", error.message);
          break;
        }

        if (data) {
          allAirlines = [...allAirlines, ...(data as Airline[])];
          if (data.length < size) {
            hasMore = false;
          } else {
            start += size;
          }
        } else {
          hasMore = false;
        }
      }

      setAirlines(allAirlines);
      setLoading(false);
    };

    fetchAirlines();
  }, [supabase]);

  // Resetta la pagina a 1 quando si cambiano filtri o ricerca
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, allianceFilter, sortBy, pageSize]);

  // Calcolo Statistiche Dinamiche
  const stats = useMemo(() => {
    const total = airlines.length;
    const active = airlines.filter(a => !a.closed_year).length;
    const defunct = airlines.filter(a => a.closed_year).length;
    
    // Conteggio alleanze standardizzato
    let star = 0;
    let skyteam = 0;
    let oneworld = 0;
    let independent = 0;

    airlines.forEach(a => {
      const allianceLower = (a.alliance || "").toLowerCase();
      if (allianceLower.includes("star")) star++;
      else if (allianceLower.includes("skyteam")) skyteam++;
      else if (allianceLower.includes("oneworld") || allianceLower.includes("one world")) oneworld++;
      else independent++;
    });

    return { total, active, defunct, star, skyteam, oneworld, independent };
  }, [airlines]);

  // Filtro ed ordinamento dei dati
  const filteredAndSortedAirlines = useMemo(() => {
    let result = [...airlines];

    // 1. Ricerca testuale
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) ||
        (a.iata_code && a.iata_code.toLowerCase().includes(q)) ||
        (a.icao_code && a.icao_code.toLowerCase().includes(q)) ||
        a.country.toLowerCase().includes(q) ||
        (a.callsign && a.callsign.toLowerCase().includes(q)) ||
        (a.main_hub && a.main_hub.toLowerCase().includes(q))
      );
    }

    // 2. Filtro Stato
    if (statusFilter === "active") {
      result = result.filter(a => !a.closed_year);
    } else if (statusFilter === "defunct") {
      result = result.filter(a => a.closed_year);
    }

    // 3. Filtro Alleanza
    if (allianceFilter !== "all") {
      if (allianceFilter === "independent") {
        result = result.filter(a => {
          const allianceLower = (a.alliance || "").toLowerCase();
          return !allianceLower.includes("star") && 
                 !allianceLower.includes("skyteam") && 
                 !allianceLower.includes("oneworld") && 
                 !allianceLower.includes("one world");
        });
      } else {
        result = result.filter(a => 
          (a.alliance || "").toLowerCase().includes(allianceFilter.toLowerCase())
        );
      }
    }

    // 4. Ordinamento
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "founded_asc") {
        return a.founded_year - b.founded_year;
      } else if (sortBy === "founded_desc") {
        return b.founded_year - a.founded_year;
      } else if (sortBy === "country") {
        return a.country.localeCompare(b.country);
      }
      return 0;
    });

    return result;
  }, [airlines, search, statusFilter, allianceFilter, sortBy]);

  // Paginazione
  const paginatedAirlines = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedAirlines.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedAirlines, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedAirlines.length / pageSize);

  // Generatore di badge alleanze
  const renderAllianceBadge = (alliance: string | null) => {
    if (!alliance) return null;
    const allianceLower = alliance.toLowerCase();

    if (allianceLower.includes("star")) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          Star Alliance
        </span>
      );
    } else if (allianceLower.includes("skyteam")) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          SkyTeam
        </span>
      );
    } else if (allianceLower.includes("oneworld") || allianceLower.includes("one world")) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
          Oneworld
        </span>
      );
    } else if (allianceLower.includes("nessuna") || allianceLower.includes("none")) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-700/60 bg-slate-800/40 text-slate-400">
          Indipendente
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-700/60 bg-slate-800/40 text-slate-300">
        {alliance}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 flex flex-col items-center justify-center font-mono animate-pulse gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>INIZIALIZZAZIONE REGISTRO AEROLINEE...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden">
      {/* Sfondo Radiale Sci-Fi */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(0,0,0,0))] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header principale */}
        <div className="mb-8 border-b border-slate-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              AirDex Civil Aviation Registry
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Terminal Compagnie
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Esplora l&apos;indice degli operatori aerei civili storici e attivi. Analizza codici, alleanze, hub strategici e flotta.
            </p>
          </div>

          <div className="font-mono text-xs text-slate-500 border border-slate-900 bg-slate-950 p-3 rounded-xl flex gap-6">
            <div>
              <span className="block text-slate-600 uppercase">Status</span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
            <div>
              <span className="block text-slate-600 uppercase">Records</span>
              <span className="text-slate-200 font-bold">{airlines.length} Vettori</span>
            </div>
          </div>
        </div>

        {/* Dashboard Statistiche per AvGeeks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-emerald-500/25 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Operatori Totali</span>
            <span className="text-3xl font-black text-white font-mono block">{stats.total}</span>
            <span className="text-[9px] text-slate-600 font-mono block mt-1">Database globale di sempre</span>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-emerald-500/25 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Vettori Attivi</span>
            <span className="text-3xl font-black text-emerald-400 font-mono block">{stats.active}</span>
            <span className="text-[9px] text-emerald-500/50 font-mono block mt-1">{Math.round((stats.active/stats.total)*100)}% del totale operanti</span>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-emerald-500/25 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Marchi Storici</span>
            <span className="text-3xl font-black text-amber-500 font-mono block">{stats.defunct}</span>
            <span className="text-[9px] text-amber-600/50 font-mono block mt-1">{stats.defunct} compagnie confluite o chiuse</span>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-emerald-500/25 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Membri Alleanze</span>
            <span className="text-3xl font-black text-cyan-400 font-mono block">
              {stats.star + stats.skyteam + stats.oneworld}
            </span>
            <span className="text-[9px] text-cyan-500/50 font-mono block mt-1">Star: {stats.star} | Sky: {stats.skyteam} | One: {stats.oneworld}</span>
          </div>
        </div>

        {/* Pannello di Controllo Filtri */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 mb-8 backdrop-blur-md relative overflow-hidden shadow-inner">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            
            {/* Input Cerca */}
            <div className="lg:col-span-4">
              <label className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Cerca Vettore</label>
              <div className="relative">
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome, codice IATA/ICAO, hub, callsign..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 text-white border border-slate-900 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none font-mono text-sm transition-all placeholder:text-slate-700"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 absolute left-3.5 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtro Stato */}
            <div className="lg:col-span-3">
              <label className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Stato Operativo</label>
              <div className="grid grid-cols-3 bg-slate-950/80 p-1 rounded-2xl border border-slate-900 font-mono text-xs">
                <button 
                  onClick={() => setStatusFilter("all")}
                  className={`py-2 rounded-xl transition-all ${statusFilter === "all" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Tutti
                </button>
                <button 
                  onClick={() => setStatusFilter("active")}
                  className={`py-2 rounded-xl transition-all ${statusFilter === "active" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Attivi
                </button>
                <button 
                  onClick={() => setStatusFilter("defunct")}
                  className={`py-2 rounded-xl transition-all ${statusFilter === "defunct" ? "bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Storici
                </button>
              </div>
            </div>

            {/* Filtro Alleanza */}
            <div className="lg:col-span-2">
              <label className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Alleanza</label>
              <select 
                value={allianceFilter}
                onChange={(e) => setAllianceFilter(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950/80 text-slate-300 border border-slate-900 focus:border-emerald-500/80 focus:outline-none font-mono text-xs transition-all cursor-pointer"
              >
                <option value="all">Tutte le alleanze</option>
                <option value="star">Star Alliance</option>
                <option value="skyteam">SkyTeam</option>
                <option value="oneworld">Oneworld</option>
                <option value="independent">Indipendenti</option>
              </select>
            </div>

            {/* Ordinamento */}
            <div className="lg:col-span-2">
              <label className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Ordina per</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-3 rounded-2xl bg-slate-950/80 text-slate-300 border border-slate-900 focus:border-emerald-500/80 focus:outline-none font-mono text-xs transition-all cursor-pointer"
              >
                <option value="name">Nome A-Z</option>
                <option value="founded_asc">Fondazione (Crescente)</option>
                <option value="founded_desc">Fondazione (Decrescente)</option>
                <option value="country">Nazione</option>
              </select>
            </div>

            {/* Dimensione Pagina */}
            <div className="lg:col-span-1">
              <label className="block text-slate-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Visualizza</label>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-slate-950/80 text-slate-300 border border-slate-900 focus:border-emerald-500/80 focus:outline-none font-mono text-xs transition-all cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={100}>Tutti</option>
              </select>
            </div>

          </div>
        </div>

        {/* Mostra info risultati trovati */}
        <div className="mb-6 flex justify-between items-center font-mono text-xs text-slate-500 px-2">
          <span>
            Trovati <strong className="text-slate-300">{filteredAndSortedAirlines.length}</strong> vettori corrispondenti
          </span>
          {totalPages > 1 && (
            <span>
              Pagina <strong className="text-slate-300">{currentPage}</strong> di <strong className="text-slate-300">{totalPages}</strong>
            </span>
          )}
        </div>

        {/* Griglia Principale delle Compagnie */}
        {paginatedAirlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {paginatedAirlines.map((airline) => {
              const isDefunct = !!airline.closed_year;

              return (
                <div 
                  key={airline.id} 
                  className={`bg-slate-900/20 border rounded-3xl p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group ${
                    isDefunct 
                      ? 'border-slate-900/80 hover:border-amber-600/40 hover:shadow-amber-950/10' 
                      : 'border-slate-900/80 hover:border-emerald-500/40 hover:shadow-emerald-950/10'
                  }`}
                >
                  {/* Badge Stato (Angolo alto-destra) */}
                  <div className="absolute top-4 right-4 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-slate-900 bg-slate-950 z-20">
                    {isDefunct ? (
                      <span className="text-amber-500 font-bold">Storico ({airline.founded_year}-{airline.closed_year})</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Attivo (Dal {airline.founded_year})</span>
                    )}
                  </div>

                  {/* Info Principali (Logo + Nome) */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 border border-slate-900/80 shadow-md shrink-0 relative overflow-hidden">
                      <AirlineLogo 
                        src={airline.logo_url} 
                        alt={`${airline.name} Logo`} 
                        airlineName={airline.name} 
                      />
                      {isDefunct && (
                        <div className="absolute inset-0 bg-slate-950/20 backdrop-saturate-50 mix-blend-color group-hover:opacity-0 transition-opacity pointer-events-none"></div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {airline.name}
                      </h2>
                      <span className="text-slate-500 text-xs font-mono block mt-0.5">{airline.country}</span>
                    </div>
                  </div>

                  {/* Pannello Dati Tecnici per appassionati */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-900 font-mono text-xs mb-4">
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase tracking-wider">IATA</span>
                      <span className="text-emerald-400 font-bold text-sm">{airline.iata_code || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase tracking-wider">ICAO</span>
                      <span className="text-purple-400 font-bold text-sm">{airline.icao_code || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase tracking-wider">Callsign</span>
                      <span className="text-blue-400 font-bold text-[10px] truncate block" title={airline.callsign || undefined}>
                        {airline.callsign || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Informazioni Logistiche Secondarie */}
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-400 mb-5 border-t border-slate-900/40 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600 uppercase">Hub Principale:</span>
                      <span className="text-slate-300 truncate max-w-[170px]" title={airline.main_hub || undefined}>
                        {airline.main_hub || "Non inserito"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 uppercase">Alleanza:</span>
                      <span>{renderAllianceBadge(airline.alliance)}</span>
                    </div>
                  </div>

                  {/* Bottone Ispeziona Flotta */}
                  <Link 
                    href={`/${lang}/airlines/${airline.id}`}
                    className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-900 hover:border-emerald-500/30 hover:bg-slate-900/40 text-slate-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex justify-center items-center gap-2 group/btn"
                  >
                    Visualizza Dettagli
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-3xl p-16 text-center font-mono text-slate-600 mb-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-800 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nessun vettore corrisponde ai criteri di ricerca impostati. Riprova modificando i filtri.
          </div>
        )}

        {/* Paginazione Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6 mb-10">
            <span className="font-mono text-xs text-slate-500">
              Mostrando da <strong className="text-slate-300">{(currentPage - 1) * pageSize + 1}</strong> a{" "}
              <strong className="text-slate-300">
                {Math.min(currentPage * pageSize, filteredAndSortedAirlines.length)}
              </strong>{" "}
              di <strong className="text-slate-300">{filteredAndSortedAirlines.length}</strong> operatori
            </span>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              {/* Prima Pagina */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-slate-900 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Prima Pagina"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Pagina Precedente */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prec
              </button>

              {/* Pagine numerate intorno alla corrente */}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(pageIdx => Math.abs(pageIdx - currentPage) <= 1 || pageIdx === 1 || pageIdx === totalPages)
                .map((pageIdx, index, arr) => {
                  const items = [];
                  if (index > 0 && pageIdx - arr[index - 1] > 1) {
                    items.push(<span key={`ellipsis-${pageIdx}`} className="text-slate-700 px-1">...</span>);
                  }
                  items.push(
                    <button
                      key={pageIdx}
                      onClick={() => setCurrentPage(pageIdx)}
                      className={`px-3.5 py-2.5 rounded-xl transition-all border ${
                        currentPage === pageIdx
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                          : "border-slate-900 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {pageIdx}
                    </button>
                  );
                  return items;
                })}

              {/* Pagina Successiva */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                Succ
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Ultima Pagina */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-slate-900 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Ultima Pagina"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}