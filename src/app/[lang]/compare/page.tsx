"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip 
} from "recharts";
import { AircraftModel } from "../../../types";

// --- SOTTO-COMPONENTE: Autocomplete Predittivo Olografico ---
function AircraftAutocomplete({
  label,
  theme,
  aircrafts,
  selectedId,
  onSelect
}: {
  label: string;
  theme: "cyan" | "purple";
  aircrafts: AircraftModel[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isCyan = theme === "cyan";
  const labelColor = isCyan ? "text-cyan-500" : "text-purple-400";
  const focusBorder = isCyan ? "focus:border-cyan-500" : "focus:border-purple-500";
  const hoverBg = isCyan ? "hover:bg-cyan-900/40" : "hover:bg-purple-900/40";

  // Click fuori per chiudere la tendina
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mantiene sincronizzato il testo quando viene scelto un aereo
  useEffect(() => {
    if (selectedId) {
      const plane = aircrafts.find(a => a.id === selectedId);
      if (plane) {
        setQuery(`${plane.manufacturers?.name || ''} ${plane.model_name}`);
      }
    } else {
      setQuery("");
    }
  }, [selectedId, aircrafts]);

  // Motore di filtraggio istantaneo
  const filtered = useMemo(() => {
    if (!query) return aircrafts;
    
    // Se la query è esattamente il nome completo (es. appena dopo aver cliccato), mostra l'intera lista se riapri
    const selectedPlane = aircrafts.find(a => a.id === selectedId);
    const selectedFullName = selectedPlane ? `${selectedPlane.manufacturers?.name || ''} ${selectedPlane.model_name}` : "";
    if (query === selectedFullName) return aircrafts;

    // Altrimenti filtra per nome o costruttore
    return aircrafts.filter(a => 
      `${a.manufacturers?.name || ''} ${a.model_name}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, aircrafts, selectedId]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className={`block text-sm font-extrabold mb-3 uppercase tracking-wider ${labelColor}`}>
        {label}
      </label>
      
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (selectedId) onSelect(""); // Disconnette l'aereo attuale se l'utente ricomincia a scrivere
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Digita per scansionare i registri..."
        className={`w-full p-4 rounded-xl bg-slate-950 text-white border border-slate-800 font-mono text-sm transition-all focus:outline-none ${focusBorder}`}
      />

      {isOpen && (
        <ul className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] custom-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <li 
                key={a.id}
                onClick={() => {
                  onSelect(a.id);
                  setIsOpen(false);
                }}
                className={`p-3.5 cursor-pointer border-b border-slate-900 transition-colors ${hoverBg}`}
              >
                <div className="text-slate-400 text-xs font-mono">{a.manufacturers?.name || "Sconosciuto"}</div>
                <div className="text-white font-extrabold text-sm mt-0.5">{a.model_name}</div>
              </li>
            ))
          ) : (
            <li className="p-4 text-slate-500 font-mono text-sm text-center">Nessun segnale rilevato</li>
          )}
        </ul>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPALE ---
export default function ComparePage({ params }: { params: { lang: string } }) {
  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIdA, setSelectedIdA] = useState<string>("");
  const [selectedIdB, setSelectedIdB] = useState<string>("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAircrafts = async () => {
      const { data, error } = await supabase
        .from("aircraft_models")
        .select("id, model_name, range_km, max_passengers, first_flight_year, rarity, manufacturers(name)")
        .order("model_name", { ascending: true });

      if (!error && data) {
        setAircrafts(data as unknown as AircraftModel[]);
      }
      setLoading(false);
    };

    fetchAircrafts();
  }, [supabase]);

  const planeA = useMemo(() => aircrafts.find(a => a.id === selectedIdA), [aircrafts, selectedIdA]);
  const planeB = useMemo(() => aircrafts.find(a => a.id === selectedIdB), [aircrafts, selectedIdB]);

  const chartData = useMemo(() => {
    if (!planeA && !planeB) return [];

    const rarityScores: Record<string, number> = {
      COMMON: 20, UNCOMMON: 40, RARE: 60, EPIC: 80, LEGENDARY: 100
    };

    const getRarityScore = (rarity?: string) => rarity ? rarityScores[rarity] || 20 : 0;
    const getModernityScore = (year?: number) => year ? Math.max(0, ((year - 1910) / 116) * 100) : 0;
    const getPaxScore = (pax?: number) => pax ? Math.min(100, (pax / 850) * 100) : 0;
    const getRangeScore = (range?: number) => range ? Math.min(100, (range / 18000) * 100) : 0;

    return [
      {
        subject: "Autonomia",
        A: planeA ? getRangeScore(planeA.range_km) : 0,
        B: planeB ? getRangeScore(planeB.range_km) : 0,
      },
      {
        subject: "Capienza PAX",
        A: planeA ? getPaxScore(planeA.max_passengers) : 0,
        B: planeB ? getPaxScore(planeB.max_passengers) : 0,
      },
      {
        subject: "Modernità",
        A: planeA ? getModernityScore(planeA.first_flight_year) : 0,
        B: planeB ? getModernityScore(planeB.first_flight_year) : 0,
      },
      {
        subject: "Grado Rarità",
        A: planeA ? getRarityScore(planeA.rarity) : 0,
        B: planeB ? getRarityScore(planeB.rarity) : 0,
      }
    ];
  }, [planeA, planeB]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono animate-pulse">Avvio Hangar di Comparazione...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Hangar di Comparazione</h1>
          <p className="text-cyan-500 font-mono text-sm uppercase tracking-widest">
            Analisi Telemetrica Incrociata
          </p>
        </div>        {/* Selettori Autocomplete Vettori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-20">
          <div className="bg-slate-900/90 p-8 rounded-3xl border-t-4 border-cyan-500 shadow-xl border border-slate-800 backdrop-blur-xl">
            <AircraftAutocomplete 
              label="Vettore Alpha" 
              theme="cyan" 
              aircrafts={aircrafts} 
              selectedId={selectedIdA} 
              onSelect={setSelectedIdA} 
            />
          </div>

          <div className="bg-slate-900/90 p-8 rounded-3xl border-t-4 border-purple-500 shadow-xl border border-slate-800 backdrop-blur-xl">
            <AircraftAutocomplete 
              label="Vettore Bravo" 
              theme="purple" 
              aircrafts={aircrafts} 
              selectedId={selectedIdB} 
              onSelect={setSelectedIdB} 
            />
          </div>
        </div>

        {/* Area Dati */}
        {(planeA || planeB) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-900/90 p-8 rounded-3xl border border-slate-800 relative z-10 backdrop-blur-xl shadow-2xl">
            
            {/* Ologramma Radar Chart */}
            <div className="h-[400px] w-full flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-850 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 13, fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#06b6d4' }}
                    formatter={() => ["", ""]}
                  />
                  {planeA && (
                    <Radar name={planeA.model_name} dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                  )}
                  {planeB && (
                    <Radar name={planeB.model_name} dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                  )}
                  <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabella Dati Grezzi */}
            <div className="flex flex-col justify-center gap-4">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-805 pb-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest text-center">
                <div className="text-cyan-400 text-sm font-extrabold">{planeA?.model_name || "—"}</div>
                <div className="font-sans uppercase text-slate-400 font-bold">Parametro</div>
                <div className="text-purple-400 text-sm font-extrabold">{planeB?.model_name || "—"}</div>
              </div>

              {/* Riga: Autonomia */}
              <div className="grid grid-cols-3 gap-4 p-4.5 text-center items-center bg-slate-950/60 rounded-xl border border-slate-800 hover:bg-slate-900/40 transition-colors shadow-inner">
                <div className="text-white font-extrabold text-xl">{planeA?.range_km ? `${planeA.range_km.toLocaleString()} km` : "—"}</div>
                <div className="text-slate-400 text-sm font-sans uppercase font-bold">Autonomia</div>
                <div className="text-white font-extrabold text-xl">{planeB?.range_km ? `${planeB.range_km.toLocaleString()} km` : "—"}</div>
              </div>

              {/* Riga: Passeggeri */}
              <div className="grid grid-cols-3 gap-4 p-4.5 text-center items-center bg-slate-950/60 rounded-xl border border-slate-800 hover:bg-slate-900/40 transition-colors shadow-inner">
                <div className="text-white font-extrabold text-xl">{planeA?.max_passengers ? `${planeA.max_passengers} PAX` : "—"}</div>
                <div className="text-slate-400 text-sm font-sans uppercase font-bold">Capienza Max</div>
                <div className="text-white font-extrabold text-xl">{planeB?.max_passengers ? `${planeB.max_passengers} PAX` : "—"}</div>
              </div>

              {/* Riga: Anno */}
              <div className="grid grid-cols-3 gap-4 p-4.5 text-center items-center bg-slate-950/60 rounded-xl border border-slate-800 hover:bg-slate-900/40 transition-colors shadow-inner">
                <div className="text-white font-extrabold text-xl">{planeA?.first_flight_year || "—"}</div>
                <div className="text-slate-400 text-sm font-sans uppercase font-bold">Primo Volo</div>
                <div className="text-white font-extrabold text-xl">{planeB?.first_flight_year || "—"}</div>
              </div>

              {/* Riga: Rarità */}
              <div className="grid grid-cols-3 gap-4 p-4.5 text-center items-center bg-slate-950/60 rounded-xl border border-slate-800 hover:bg-slate-900/40 transition-colors shadow-inner">
                <div className="text-cyan-405 text-sm font-black uppercase tracking-wider">{planeA?.rarity || "—"}</div>
                <div className="text-slate-400 text-sm font-sans uppercase font-bold">Rarità</div>
                <div className="text-purple-405 text-sm font-black uppercase tracking-wider">{planeB?.rarity || "—"}</div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}