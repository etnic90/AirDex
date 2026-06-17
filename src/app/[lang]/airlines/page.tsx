"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

interface Airline {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  country: string;
  founded_year: number;
  closed_year: number | null;
  website: string | null;
  logo_url: string | null; // <-- Interfaccia allineata al database
}

export default function AirlinesPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = React.use(params);
  const lang = unwrappedParams.lang;

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAirlines = async () => {
      const { data, error } = await supabase
        .from("airlines")
        .select("*") // Seleziona tutto, incluso logo_url
        .order("name", { ascending: true });

      if (!error && data) {
        setAirlines(data as Airline[]);
      }
      setLoading(false);
    };

    fetchAirlines();
  }, [supabase]);

  const filteredAirlines = useMemo(() => {
    return airlines.filter(a => 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.iata_code && a.iata_code.toLowerCase().includes(search.toLowerCase())) ||
      (a.icao_code && a.icao_code.toLowerCase().includes(search.toLowerCase()))
    );
  }, [airlines, search]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono animate-pulse">Inizializzazione Registro Vettori...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Terminal Compagnie</h1>
            <p className="text-cyan-500 font-mono text-sm uppercase tracking-widest">
              Database Operatori Globali & Alleanze
            </p>
          </div>

          <div className="w-full md:w-80">
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca vettore (Es. UAE, Emirates)..."
              className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>

        {/* Griglia Compagnie */}
        {filteredAirlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAirlines.map((airline) => {
              // GERARCHIA LOGHI BLINDATA ANCHE QUI
              const logoSrc = airline.logo_url 
                ? airline.logo_url 
                : (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

              return (
                <div 
                  key={airline.id} 
                  className={`bg-slate-900/40 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group ${
                    airline.closed_year 
                      ? 'border-slate-800 hover:border-amber-600/50' 
                      : 'border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-slate-800 bg-slate-950">
                    {airline.closed_year ? (
                      <span className="text-amber-500 font-bold">Storico ({airline.founded_year}-{airline.closed_year})</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Attivo (Dal {airline.founded_year})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-2 border border-slate-800 shadow-md overflow-hidden relative z-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={logoSrc || ""} 
                        alt={`${airline.name} Logo`}
                        className={`max-w-full max-h-full object-contain ${airline.closed_year ? 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}
                        onError={(e) => {
                          // Fallback immediato a badge olografico se l'URL fallisce o è nullo
                          (e.target as HTMLImageElement).src = `https://avatar.oxro.io/avatar.svg?name=${encodeURIComponent(airline.name)}&background=0f172a&color=06b6d4`;
                        }}
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{airline.name}</h2>
                      <p className="text-slate-400 text-xs font-mono">{airline.country}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-xs mb-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Codice IATA</span>
                      <span className="text-cyan-400 font-bold">{airline.iata_code || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Codice ICAO</span>
                      <span className="text-purple-400 font-bold">{airline.icao_code || "—"}</span>
                    </div>
                  </div>

                  <Link 
                    href={`/${lang}/airlines/${airline.id}`}
                    className="w-full py-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-2"
                  >
                    Ispeziona Flotta
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center font-mono text-slate-500">
            Nessun operatore corrisponde ai criteri di ricerca.
          </div>
        )}

      </div>
    </main>
  );
}