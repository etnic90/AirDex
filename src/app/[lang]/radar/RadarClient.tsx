"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { AircraftModel } from "../../../types";
import AircraftCard from "../../../components/AircraftCard";

export default function RadarClient({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  
  // --- STATI DELLA FLOTTA ---
  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATI DEI FILTRI ---
  const initialSearch = searchParams.get("search") || "";
  const initialEra = searchParams.get("era") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); 
  const [rarityFilter, setRarityFilter] = useState<string>("ALL"); 
  const [eraFilter, setEraFilter] = useState<string>(initialEra); 
  
  // NUOVI FILTRI AVANZATI (Slider)
  const [minRange, setMinRange] = useState<number>(0); // Range in km
  const [minPassengers, setMinPassengers] = useState<number>(0); // Capienza PAX

  // Paginazione client-side per evitare bloat del DOM
  const [visibleCount, setVisibleCount] = useState<number>(18);

  // Reset del contatore elementi visibili quando cambiano i filtri
  useEffect(() => {
    setVisibleCount(18);
  }, [searchTerm, statusFilter, rarityFilter, eraFilter, minRange, minPassengers]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAllAircrafts = async () => {
      // Scarichiamo tutto il DB una sola volta per permettere il filtro istantaneo
      const { data, error } = await supabase
        .from("aircraft_models")
        .select(`*, manufacturers (name)`)
        .order("first_flight_year", { ascending: false });

      if (!error && data) {
        setAircrafts(data as AircraftModel[]);
      }
      setLoading(false);
    };

    fetchAllAircrafts();
  }, [supabase]);

  // --- LOGICA DI FILTRAGGIO LIVE ---
  const filteredAircrafts = useMemo(() => {
    return aircrafts.filter((aircraft) => {
      // 1. Filtro Testo (Modello o Costruttore)
      const matchesSearch = 
        aircraft.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (aircraft.manufacturers?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (aircraft.type || "").toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Filtro Status
      const matchesStatus = statusFilter === "ALL" || aircraft.status === statusFilter;

      // 3. Filtro Rarità
      const matchesRarity = rarityFilter === "ALL" || aircraft.rarity === rarityFilter;

      // 4. Filtro Era Storica
      let matchesEra = true;
      if (eraFilter !== "ALL" && eraFilter !== "") {
        const year = aircraft.first_flight_year || 0;
        if (eraFilter === "pioneers") matchesEra = year > 0 && year < 1946;
        if (eraFilter === "golden") matchesEra = year >= 1946 && year <= 1957;
        if (eraFilter === "jetage") matchesEra = year >= 1958 && year <= 1999;
        if (eraFilter === "modern") matchesEra = year >= 2000;
      }

      // 5. Filtro Autonomia (Range) - Tolleranza per record storici senza dato se lo slider è a 0
      const matchesRange = minRange === 0 ? true : (aircraft.range_km && aircraft.range_km >= minRange);

      // 6. Filtro Passeggeri (PAX)
      const matchesPassengers = minPassengers === 0 ? true : (aircraft.max_passengers && aircraft.max_passengers >= minPassengers);

      return matchesSearch && matchesStatus && matchesRarity && matchesEra && matchesRange && matchesPassengers;
    });
  }, [aircrafts, searchTerm, statusFilter, rarityFilter, eraFilter, minRange, minPassengers]);

  if (loading) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* ---------------- PANNELLO FILTRI LATERALE ---------------- */}
      <aside className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl sticky top-24 shadow-xl">
          
          <h2 className="text-cyan-500 font-mono text-sm uppercase tracking-widest font-black mb-6 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Parametri Sensori</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </h2>

          {/* Ricerca Diretta */}
          <div className="mb-5">
            <label className="block text-slate-350 text-xs font-bold mb-2 uppercase tracking-wider">Identificativo</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Es. Concorde, B777..." 
              className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-all"
            />
          </div>

          {/* Filtro Status */}
          <div className="mb-5">
            <label className="block text-slate-355 text-xs font-bold mb-2 uppercase tracking-wider">Status Operativo</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-all cursor-pointer"
            >
              <option value="ALL">TUTTI I VETTORI</option>
              <option value="ACTIVE">ATTIVI (In Servizio)</option>
              <option value="HISTORIC">STORICI (Ritirati)</option>
            </select>
          </div>

          {/* Filtro Epoca */}
          <div className="mb-5">
            <label className="block text-slate-355 text-xs font-bold mb-2 uppercase tracking-wider">Epoca Storica</label>
            <select 
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-all cursor-pointer"
            >
              <option value="ALL">TUTTE LE EPOCHE</option>
              <option value="pioneers">1910 - 1945 (Pionieri)</option>
              <option value="golden">1946 - 1957 (Età d'Oro)</option>
              <option value="jetage">1958 - 1999 (Era Jet)</option>
              <option value="modern">2000 - Oggi (Era Moderna)</option>
            </select>
          </div>

          {/* Filtro Rarità */}
          <div className="mb-6">
            <label className="block text-slate-355 text-xs font-bold mb-2 uppercase tracking-wider">Grado Rarità</label>
            <select 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-all cursor-pointer"
            >
              <option value="ALL">QUALSIASI GRADO</option>
              <option value="COMMON">COMMON (Diffuso)</option>
              <option value="UNCOMMON">UNCOMMON (Frequente)</option>
              <option value="RARE">RARE (Raro)</option>
              <option value="EPIC">EPIC (Epico)</option>
              <option value="LEGENDARY">LEGENDARY (Leggendario)</option>
            </select>
          </div>

          {/* --- SLIDER AVANZATI --- */}
          <div className="border-t border-slate-800 pt-5 mb-5">
            <div className="flex justify-between items-end mb-3">
              <label className="block text-cyan-500 text-xs font-extrabold uppercase tracking-wider">Autonomia Minima</label>
              <span className="text-cyan-300 font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-850 shadow-inner font-bold">
                {minRange > 0 ? `+${minRange.toLocaleString()} km` : 'DISATTIVATO'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="18000" 
              step="500"
              value={minRange}
              onChange={(e) => setMinRange(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono font-bold">
              <span>0</span>
              <span>9000</span>
              <span>18k km</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <label className="block text-cyan-500 text-xs font-extrabold uppercase tracking-wider">Capienza Minima</label>
              <span className="text-cyan-300 font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-850 shadow-inner font-bold">
                {minPassengers > 0 ? `+${minPassengers} PAX` : 'DISATTIVATO'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="900" 
              step="10"
              value={minPassengers}
              onChange={(e) => setMinPassengers(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono font-bold">
              <span>0</span>
              <span>450</span>
              <span>900 PAX</span>
            </div>
          </div>

          {/* Reset Filtri */}
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setEraFilter("ALL");
              setRarityFilter("ALL");
              setMinRange(0);
              setMinPassengers(0);
            }}
            className="w-full mt-2 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-600 hover:bg-slate-900/60 p-4 rounded-xl text-xs font-mono uppercase tracking-widest transition-all flex justify-center items-center gap-2 font-bold cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Calibrazione
          </button>
        </div>
      </aside>

      {/* ---------------- GRIGLIA RISULTATI ---------------- */}
      <section className="w-full flex-1">
        {/* Info Risultati */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 flex justify-between items-center backdrop-blur-xl shadow-lg">
          <span className="text-cyan-400 font-mono text-base uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vettori Identificati: <strong className="text-white ml-1 text-xl">{filteredAircrafts.length}</strong>
          </span>
        </div>

        {/* Griglia AircraftCard */}
        {filteredAircrafts.length > 0 ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredAircrafts.slice(0, visibleCount).map((aircraft) => (
                <AircraftCard key={aircraft.id} aircraft={aircraft} lang={lang} />
              ))}
            </div>
            {filteredAircrafts.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 18)}
                className="w-full mt-4 text-cyan-400 hover:text-white border border-cyan-800/80 hover:border-cyan-500 hover:bg-cyan-950/30 p-4.5 rounded-2xl text-sm font-mono uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] flex justify-center items-center gap-2 cursor-pointer font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                Espandi Tracciamento Radar (+18 Aerei)
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-dashed border-slate-700 rounded-3xl p-16 flex flex-col items-center justify-center text-center backdrop-blur-xl">
            <svg className="w-16 h-16 text-slate-605 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-xl text-white font-black uppercase tracking-widest mb-2">Nessun Riscontro Radar</p>
            <p className="text-slate-400 font-mono text-sm">Modifica i parametri di scansione per ampliare l'area di ricerca.</p>
          </div>
        )}
      </section>

    </div>
  );
}