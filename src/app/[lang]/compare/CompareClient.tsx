"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip 
} from "recharts";
import { AircraftModel } from "@/types";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Trova l'aereo correntemente selezionato per visualizzarlo nel campo di input
  const currentPlane = useMemo(() => {
    return aircrafts.find(a => a.id === selectedId) || null;
  }, [aircrafts, selectedId]);

  // Sincronizza l'input del query se cambia la selezione esterna
  useEffect(() => {
    if (currentPlane) {
      setQuery(currentPlane.model_name);
    } else {
      setQuery("");
    }
  }, [currentPlane]);

  // Filtra suggerimenti in base a query
  const suggestions = useMemo(() => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];
    return aircrafts.filter(a => 
      a.model_name.toLowerCase().includes(cleanQuery) || 
      (a.manufacturers?.name || "").toLowerCase().includes(cleanQuery)
    ).slice(0, 5);
  }, [query, aircrafts]);

  // Gestione click esterno per chiudere tendina
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Ripristina il nome originale se non è stato salvato nulla
        if (currentPlane) {
          setQuery(currentPlane.model_name);
        } else {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [currentPlane]);

  const selectColorClass = theme === "cyan" 
    ? "focus:border-cyan-500/80 focus:ring-cyan-500/20 text-cyan-400 placeholder:text-cyan-900/40 border-cyan-950 bg-cyan-950/20"
    : "focus:border-purple-500/80 focus:ring-purple-500/20 text-purple-400 placeholder:text-purple-900/40 border-purple-950 bg-purple-950/20";

  return (
    <div ref={containerRef} className="relative w-full font-mono text-xs">
      <label className={`block uppercase tracking-[0.2em] font-black mb-2 ${theme === "cyan" ? "text-cyan-500" : "text-purple-400"}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Modello o Produttore..."
          className={`w-full border rounded-xl px-4.5 py-3.5 focus:outline-none focus:ring-4 transition-all uppercase font-bold tracking-wider ${selectColorClass}`}
        />
        
        {/* Tendina olografica */}
        {isOpen && suggestions.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-2xl backdrop-blur-xl z-30 p-1.5 overflow-hidden ${
            theme === "cyan" ? "bg-slate-900/90 border-cyan-950" : "bg-slate-900/90 border-purple-950"
          }`}>
            {suggestions.map((plane) => (
              <button
                key={plane.id}
                onClick={() => {
                  onSelect(plane.id);
                  setQuery(plane.model_name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                  theme === "cyan" 
                    ? "hover:bg-cyan-500/10 hover:text-cyan-300 text-slate-300"
                    : "hover:bg-purple-500/10 hover:text-purple-300 text-slate-300"
                }`}
              >
                <span className="font-extrabold uppercase">{plane.model_name}</span>
                <span className="text-[10px] text-slate-500 uppercase">{plane.manufacturers?.name || "Aviation"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPALE ---
export default function CompareClient({ lang }: { lang: string }) {
  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);

  // ID dei velivoli da confrontare
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAircrafts = async () => {
      const { data } = await supabase
        .from("aircraft_models")
        .select(`
          id,
          model_name,
          type,
          max_passengers,
          range_km,
          max_speed_kmh,
          service_ceiling_ft,
          manufacturers ( name )
        `)
        .order("model_name");

      if (data) {
        setAircrafts(data as unknown as AircraftModel[]);
        // Inizializza i primi due aerei per il rendering
        if (data.length >= 2) {
          setIdA(data[0].id);
          setIdB(data[1].id);
        }
      }
      setLoading(false);
    };

    fetchAircrafts();
  }, [supabase]);

  // Trova gli aerei selezionati
  const planeA = useMemo(() => aircrafts.find(a => a.id === idA) || null, [aircrafts, idA]);
  const planeB = useMemo(() => aircrafts.find(a => a.id === idB) || null, [aircrafts, idB]);

  // Genera i dati per il grafico radar Recharts
  const chartData = useMemo(() => {
    if (!planeA || !planeB) return [];

    // Troviamo i valori massimi nel dataset per normalizzare il radar tra 0 e 100%
    const maxVals = {
      pax: Math.max(...aircrafts.map(a => a.max_passengers || 1), 1),
      range: Math.max(...aircrafts.map(a => a.range_km || 1), 1),
      speed: Math.max(...aircrafts.map(a => a.max_speed_kmh || 1), 1),
      ceiling: Math.max(...aircrafts.map(a => a.service_ceiling_ft || 1), 1),
    };

    const isIt = lang === "it";

    return [
      {
        subject: isIt ? "Passeggeri" : "Passengers",
        A: Math.round(((planeA.max_passengers || 0) / maxVals.pax) * 100),
        valA: planeA.max_passengers || 0,
        B: Math.round(((planeB.max_passengers || 0) / maxVals.pax) * 100),
        valB: planeB.max_passengers || 0,
      },
      {
        subject: isIt ? "Autonomia" : "Range",
        A: Math.round(((planeA.range_km || 0) / maxVals.range) * 100),
        valA: `${(planeA.range_km || 0).toLocaleString()} km`,
        B: Math.round(((planeB.range_km || 0) / maxVals.range) * 100),
        valB: `${(planeB.range_km || 0).toLocaleString()} km`,
      },
      {
        subject: isIt ? "Velocità" : "Speed",
        A: Math.round(((planeA.max_speed_kmh || 0) / maxVals.speed) * 100),
        valA: planeA.max_speed_kmh ? `${planeA.max_speed_kmh} km/h` : "—",
        B: Math.round(((planeB.max_speed_kmh || 0) / maxVals.speed) * 100),
        valB: planeB.max_speed_kmh ? `${planeB.max_speed_kmh} km/h` : "—",
      },
      {
        subject: isIt ? "Quota di Tangenza" : "Ceiling",
        A: Math.round(((planeA.service_ceiling_ft || 0) / maxVals.ceiling) * 100),
        valA: planeA.service_ceiling_ft ? `${planeA.service_ceiling_ft.toLocaleString()} ft` : "—",
        B: Math.round(((planeB.service_ceiling_ft || 0) / maxVals.ceiling) * 100),
        valB: planeB.service_ceiling_ft ? `${planeB.service_ceiling_ft.toLocaleString()} ft` : "—",
      },
    ];
  }, [planeA, planeB, aircrafts, lang]);

  const isIt = lang === "it";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-500 rounded-full animate-spin"></div>
        <span className="tracking-[0.25em] uppercase text-xs animate-pulse">Taratura Sensori Vettoriali...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Griglia olografica radar */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.04),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Intestazione */}
        <div className="mb-10 text-center border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            Aero-Comparison System v2.0
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
            {isIt ? "Confronto Aeromobili" : "Aircraft Comparison"}
          </h1>
          <p className="text-slate-400 text-sm mt-3.5 max-w-xl mx-auto leading-relaxed">
            {isIt 
              ? "Seleziona due aerei commerciali per sovrapporre le loro specifiche prestazionali su un grafico polare olografico."
              : "Select two commercial aircraft to overlay their performance specifications on a polar holographic radar chart."}
          </p>
        </div>

        {/* CONTROLLI DI SELEZIONE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 border border-slate-900 p-6 rounded-3xl backdrop-blur-xl mb-10 relative overflow-hidden shadow-md">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-900/60 hidden md:block"></div>
          
          <AircraftAutocomplete
            label={isIt ? "Velivolo Primario (Canale Alpha)" : "Primary Aircraft (Alpha Channel)"}
            theme="cyan"
            aircrafts={aircrafts}
            selectedId={idA}
            onSelect={setIdA}
          />

          <AircraftAutocomplete
            label={isIt ? "Velivolo Secondario (Canale Beta)" : "Secondary Aircraft (Beta Channel)"}
            theme="purple"
            aircrafts={aircrafts}
            selectedId={idB}
            onSelect={setIdB}
          />
        </div>

        {/* GRID COMPARATIVA */}
        {planeA && planeB ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
            
            {/* LATO PRESTAZIONALE RADAR (7 colonne) */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-center items-center relative overflow-hidden min-h-[400px]">
              <div className="absolute top-4 left-4 font-mono text-[10px] text-slate-550 uppercase tracking-widest">
                {"// COPERTURA RADAR PRESTAZIONALE"}
              </div>
              
              <div className="w-full h-80 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: "#475569", fontSize: 8 }} 
                    />
                    
                    <Radar
                      name={planeA.model_name.toUpperCase()}
                      dataKey="A"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name={planeB.model_name.toUpperCase()}
                      dataKey="B"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.15}
                    />
                    
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs shadow-2xl">
                              <p className="text-white font-black uppercase mb-2 pb-1 border-b border-slate-900">{data.subject}</p>
                              <p className="text-cyan-400 flex justify-between gap-6">
                                <span className="font-extrabold">{planeA.model_name.toUpperCase()}:</span>
                                <span>{data.valA} ({data.A}%)</span>
                              </p>
                              <p className="text-purple-400 flex justify-between gap-6 mt-1">
                                <span className="font-extrabold">{planeB.model_name.toUpperCase()}:</span>
                                <span>{data.valB} ({data.B}%)</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 10, fontFamily: "monospace", paddingTop: 10 }}
                      formatter={(value) => <span className="text-slate-300 font-bold uppercase">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABELLA CONFRONTO DETTAGLIATA (5 colonne) */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                  <span>📊</span> {isIt ? "SCHEDA COMPARATIVA METRICHE" : "METRICS COMPARISON SHEET"}
                </h3>
                
                <div className="mt-6 space-y-5 font-mono text-xs">
                  {/* Costruttore */}
                  <div className="py-2.5 border-b border-slate-950/60 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">Costruttore</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-cyan-400 font-black uppercase truncate">{planeA.manufacturers?.name || "Sconosciuto"}</span>
                      <span className="text-purple-400 font-black uppercase truncate">{planeB.manufacturers?.name || "Sconosciuto"}</span>
                    </div>
                  </div>

                  {/* Tipo di Ruolo */}
                  <div className="py-2.5 border-b border-slate-950/60 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">Categoria Operativa</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-white font-extrabold truncate">{planeA.type || "Commercial Jet"}</span>
                      <span className="text-white font-extrabold truncate">{planeB.type || "Commercial Jet"}</span>
                    </div>
                  </div>

                  {/* Passeggeri Max */}
                  <div className="py-2.5 border-b border-slate-950/60 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">{isIt ? "Capienza Passeggeri Max" : "Max Passenger Capacity"}</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-cyan-400 font-black text-sm">{planeA.max_passengers ? `${planeA.max_passengers} Pax` : "—"}</span>
                      <span className="text-purple-400 font-black text-sm">{planeB.max_passengers ? `${planeB.max_passengers} Pax` : "—"}</span>
                    </div>
                  </div>

                  {/* Autonomia Range */}
                  <div className="py-2.5 border-b border-slate-950/60 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">{isIt ? "Autonomia Operativa" : "Operating Range"}</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-cyan-400 font-black text-sm">{planeA.range_km ? `${planeA.range_km.toLocaleString()} km` : "—"}</span>
                      <span className="text-purple-400 font-black text-sm">{planeB.range_km ? `${planeB.range_km.toLocaleString()} km` : "—"}</span>
                    </div>
                  </div>

                  {/* Velocità Max */}
                  <div className="py-2.5 border-b border-slate-950/60 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">{isIt ? "Velocità Massima" : "Max Speed"}</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-cyan-400 font-black text-sm">{planeA.max_speed_kmh ? `${planeA.max_speed_kmh} km/h` : "—"}</span>
                      <span className="text-purple-400 font-black text-sm">{planeB.max_speed_kmh ? `${planeB.max_speed_kmh} km/h` : "—"}</span>
                    </div>
                  </div>

                  {/* Service Ceiling */}
                  <div className="py-2.5 flex flex-col gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px]">{isIt ? "Quota di Tangenza" : "Service Ceiling"}</span>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="text-cyan-400 font-black text-sm">{planeA.service_ceiling_ft ? `${planeA.service_ceiling_ft.toLocaleString()} ft` : "—"}</span>
                      <span className="text-purple-400 font-black text-sm">{planeB.service_ceiling_ft ? `${planeB.service_ceiling_ft.toLocaleString()} ft` : "—"}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="border border-dashed border-slate-800 bg-slate-900/10 rounded-3xl p-16 text-center text-slate-550 font-mono text-sm shadow-inner">
            Seleziona due aerei validi per avviare il confronto avionico.
          </div>
        )}

      </div>
    </main>
  );
}
