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
  // Leggiamo subito se la Home ci ha passato un parametro "search" o "era"
  const initialSearch = searchParams.get("search") || "";
  const initialEra = searchParams.get("era") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, ACTIVE, HISTORIC
  const [rarityFilter, setRarityFilter] = useState<string>("ALL"); 
  const [eraFilter, setEraFilter] = useState<string>(initialEra); // ALL, pioneers, golden, jetage, modern

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAllAircrafts = async () => {
      // Scarichiamo tutto il DB (450 record) una sola volta per permettere il filtro istantaneo
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

  // --- LOGICA DI FILTRAGGIO LIVE (USEMEMO PER MASSIME PRESTAZIONI) ---
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

      return matchesSearch && matchesStatus && matchesRarity && matchesEra;
    });
  }, [aircrafts, searchTerm, statusFilter, rarityFilter, eraFilter]);

  if (loading) return null; // Gestito dal Suspense fallback del padre

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
        {/* ---------------- PANNELLO FILTRI LATERALE ---------------- */}
      <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md sticky top-24 shadow-xl">
          
          <h2 className="text-cyan-500 font-mono text-sm uppercase tracking-widest font-black mb-6 border-b border-slate-800 pb-2">
            Parametri Sensori
          </h2>

          {/* Ricerca Diretta */}
          <div className="mb-6">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Identificativo</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Es. Concorde, B777..." 
              className="w-full p-3 rounded-lg bg-slate-950 text-white border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-colors"
            />
          </div>

          {/* Filtro Status */}
          <div className="mb-6">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Status Operativo</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-950 text-white border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-colors"
            >
              <option value="ALL">TUTTI I VETTORI</option>
              <option value="ACTIVE">ATTIVI (In Servizio)</option>
              <option value="HISTORIC">STORICI (Ritirati)</option>
            </select>
          </div>

          {/* Filtro Epoca */}
          <div className="mb-6">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Epoca Storica</label>
            <select 
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-950 text-white border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-colors"
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
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Grado Rarità</label>
            <select 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-950 text-white border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm transition-colors"
            >
              <option value="ALL">QUALSIASI GRADO</option>
              <option value="COMMON">COMMON (Diffuso)</option>
              <option value="UNCOMMON">UNCOMMON (Frequente)</option>
              <option value="RARE">RARE (Raro)</option>
              <option value="EPIC">EPIC (Epico)</option>
              <option value="LEGENDARY">LEGENDARY (Leggendario)</option>
            </select>
          </div>

          {/* Reset Filtri */}
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setEraFilter("ALL");
              setRarityFilter("ALL");
            }}
            className="w-full mt-4 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 hover:bg-slate-800 p-2 rounded text-xs font-mono uppercase tracking-widest transition-colors"
          >
            Reset Calibrazione
          </button>
        </div>
      </aside>

      {/* ---------------- GRIGLIA RISULTATI ---------------- */}
      <section className="w-full flex-1">
        {/* Info Risultati */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center backdrop-blur-sm">
          <span className="text-cyan-400 font-mono text-sm uppercase tracking-wider">
            Vettori Identificati: <strong className="text-white ml-2 text-lg">{filteredAircrafts.length}</strong>
          </span>
        </div>

        {/* Griglia AircraftCard */}
        {filteredAircrafts.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredAircrafts.map((aircraft) => (
              <AircraftCard key={aircraft.id} aircraft={aircraft} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-dashed border-slate-700 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-xl text-white font-black uppercase tracking-widest mb-2">Nessun Riscontro Radar</p>
            <p className="text-slate-500 font-mono text-sm">Modifica i parametri di scansione per ampliare l'area di ricerca.</p>
          </div>
        )}
      </section>

    </div>
  );
}