"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

interface Airport {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  runways_count: number;
  elevation_ft: number;
}

export default function AirportsPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = React.use(params);
  const lang = unwrappedParams.lang;

  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAirports = async () => {
      const { data, error } = await supabase
        .from("airports")
        .select("*")
        .order("city", { ascending: true });

      if (!error && data) {
        setAirports(data as Airport[]);
      }
      setLoading(false);
    };

    fetchAirports();
  }, [supabase]);

  const filteredAirports = useMemo(() => {
    return airports.filter(a => 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.iata_code.toLowerCase().includes(search.toLowerCase()) ||
      a.icao_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [airports, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-500 flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-12 h-12 border-4 border-t-emerald-500 border-r-transparent border-b-slate-800 border-l-slate-800 rounded-full animate-spin"></div>
        <span className="tracking-[0.2em] uppercase text-xs animate-pulse">Scansione Nodi Spazio Aereo...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Intestazione */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-900 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Terminale Aeroporti</h1>
            <p className="text-emerald-500 font-mono text-sm uppercase tracking-widest">
              Hub Logistici & Coordinate di Scalo Internazionali
            </p>
          </div>

          <div className="w-full md:w-80">
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca scalo (Es. DXB, New York, ATL)..."
              className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono text-sm transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>

        {/* Griglia dei Terminali */}
        {filteredAirports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAirports.map((airport) => {
              return (
                <div 
                  key={airport.id} 
                  className="bg-slate-900/30 border border-slate-900 hover:border-emerald-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group shadow-lg flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-emerald-500 transition-colors"></div>

                  {/* HEADER CARD STRUTTURATO PER TITOLI LUNGHI */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 w-full mb-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors break-words leading-tight">
                          {airport.name}
                        </h2>
                      </div>

                      {/* Badge Neon fisso e protetto da schiacciamenti */}
                      <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-center shadow-inner flex-shrink-0 min-w-[54px]">
                        <span className="text-emerald-400 font-black text-sm tracking-wider block">{airport.iata_code}</span>
                        <span className="text-slate-600 block text-[8px] uppercase font-bold mt-0.5">{airport.icao_code}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-xs font-mono">{airport.city}, {airport.country}</p>
                  </div>

                  <div>
                    {/* Telemetria Rapida delle Piste e Altitudine */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-900/50 font-mono text-[11px] mb-4 text-slate-400 shadow-inner">
                      <div className="flex items-center gap-1.5">
                        <span>🛫 Piste:</span>
                        <strong className="text-white font-bold">{airport.runways_count} active</strong>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>⛰️ Elev:</span>
                        <strong className="text-slate-300 font-bold">{airport.elevation_ft} ft</strong>
                      </div>
                    </div>

                    {/* Link */}
                    <Link 
                      href={`/${lang}/airports/${airport.id}`}
                      className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-emerald-400 font-mono text-xs uppercase tracking-wider transition-all flex justify-center items-center gap-2 group-hover:bg-slate-900/50"
                    >
                      Torre di Controllo
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-slate-900 rounded-2xl p-16 text-center font-mono text-slate-600 text-sm shadow-inner">
            ❌ Nessun hub identificato nei registri di navigazione.
          </div>
        )}

      </div>
    </main>
  );
}