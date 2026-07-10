"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";

// Interfaccia ridotta per i dati statistici
interface StatModel {
  range_km: number | null;
  max_passengers: number | null;
  first_flight_year: number | null;
  status: string | null;
  manufacturers: { name: string } | null;
}

export default function StatsClient({ lang }: { lang: string }) {
  const [data, setData] = useState<StatModel[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStatsData = async () => {
      const { data: dbData } = await supabase
        .from("aircraft_models")
        .select(`
          range_km,
          max_passengers,
          first_flight_year,
          status,
          manufacturers ( name )
        `);

      if (dbData) {
        setData(dbData as unknown as StatModel[]);
      }
      setLoading(false);
    };

    fetchStatsData();
  }, [supabase]);

  // --- CALCOLO STATISTICHE DI BASE ---
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const activePlanes = data.filter(d => d.status === "ACTIVE" || d.status === "OPERATIVE");
    const historicPlanes = data.filter(d => d.status === "HISTORIC" || d.status === "RETIRER" || d.status === "OUT_OF_SERVICE");

    const avgRange = Math.round(data.reduce((acc, curr) => acc + (curr.range_km || 0), 0) / data.filter(d => d.range_km).length);
    const maxCapacity = Math.max(...data.map(d => d.max_passengers || 0));
    
    // Distribuzione per Era Storica
    const eras = {
      pioneers: data.filter(d => d.first_flight_year && d.first_flight_year >= 1910 && d.first_flight_year < 1945).length,
      golden: data.filter(d => d.first_flight_year && d.first_flight_year >= 1945 && d.first_flight_year < 1960).length,
      jet: data.filter(d => d.first_flight_year && d.first_flight_year >= 1960 && d.first_flight_year < 1990).length,
      modern: data.filter(d => d.first_flight_year && d.first_flight_year >= 1990).length,
    };

    // Distribuzione per Costruttori (Top 5)
    const manufacturerCounts: Record<string, number> = {};
    data.forEach(d => {
      const name = d.manufacturers?.name || "Altri";
      manufacturerCounts[name] = (manufacturerCounts[name] || 0) + 1;
    });

    const manufacturerChartData = Object.entries(manufacturerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const otherSum = Object.entries(manufacturerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(5)
      .reduce((acc, curr) => acc + curr.value, 0);

    if (otherSum > 0) {
      manufacturerChartData.push({ name: "Altri", value: otherSum });
    }

    return {
      totalSize: data.length,
      activeCount: activePlanes.length,
      historicCount: historicPlanes.length,
      avgRange,
      maxCapacity,
      eras,
      manufacturerChartData,
    };
  }, [data]);

  const isIt = lang === "it";

  // Dati per il grafico a torta delle Ere Storiche
  const eraPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: isIt ? "Pionieri (1910-1945)" : "Pioneers (1910-1945)", value: stats.eras.pioneers, color: "#f59e0b" },
      { name: isIt ? "Età dell'Oro (1945-1960)" : "Golden Era (1945-1960)", value: stats.eras.golden, color: "#10b981" },
      { name: isIt ? "Jet Age (1960-1990)" : "Jet Age (1960-1990)", value: stats.eras.jet, color: "#3b82f6" },
      { name: isIt ? "Moderna (1990-Oggi)" : "Modern Era (1990-Today)", value: stats.eras.modern, color: "#8b5cf6" },
    ].filter(d => d.value > 0);
  }, [stats, isIt]);

  if (loading || !stats) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-500 rounded-full animate-spin"></div>
        <span className="tracking-[0.25em] uppercase text-xs animate-pulse">Sincronizzazione Database Avionico...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Sfondo Griglia Olografica */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.04),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Intestazione */}
        <div className="mb-10 text-center border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            Aviation Global Stats v1.0
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
            {isIt ? "Statistiche Globali" : "Global Aviation Stats"}
          </h1>
          <p className="text-slate-400 text-sm mt-3.5 max-w-xl mx-auto leading-relaxed">
            {isIt 
              ? "Analisi aggregata della flotta civile globale registrata in AirDex. Confronto ere storiche e principali costruttori."
              : "Aggregated analysis of the global civil fleet registered in AirDex. Comparison of historical eras and top manufacturers."}
          </p>
        </div>

        {/* METRICHE PRINCIPALI KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-md font-mono text-center shadow-md">
            <span className="text-slate-500 block uppercase text-[10px] tracking-wider mb-2">Totale Velivoli</span>
            <span className="text-white font-black text-3xl leading-none">{stats.totalSize}</span>
            <span className="text-[9px] text-slate-500 block mt-1.5">MODELLI CENSITI</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-md font-mono text-center shadow-md">
            <span className="text-slate-500 block uppercase text-[10px] tracking-wider mb-2">Flotta Attiva</span>
            <span className="text-emerald-400 font-black text-3xl leading-none">{stats.activeCount}</span>
            <span className="text-[9px] text-slate-500 block mt-1.5">OPERATIVI LIVE</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-md font-mono text-center shadow-md">
            <span className="text-slate-500 block uppercase text-[10px] tracking-wider mb-2">Raggio Medio</span>
            <span className="text-cyan-400 font-black text-3xl leading-none">{stats.avgRange.toLocaleString()} <span className="text-xs">km</span></span>
            <span className="text-[9px] text-slate-500 block mt-1.5">AUTONOMIA MEDIA</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl backdrop-blur-md font-mono text-center shadow-md">
            <span className="text-slate-500 block uppercase text-[10px] tracking-wider mb-2">Capienza Record</span>
            <span className="text-purple-400 font-black text-3xl leading-none">{stats.maxCapacity} <span className="text-xs">Pax</span></span>
            <span className="text-[9px] text-slate-500 block mt-1.5">MASSIMO PASSEGGERI</span>
          </div>
        </div>

        {/* GRAFICI A DUE COLONNE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* LATO COSTRUTTORI (7 colonne) */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between shadow-md relative min-h-[350px]">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
              <span>✈️</span> {isIt ? "FLOTTA PER PRODUTTORE (TOP 5)" : "FLEET BY MANUFACTURER (TOP 5)"}
            </h3>

            <div className="w-full h-72 mt-6 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.manufacturerChartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontFamily: "monospace", fontSize: 11, borderRadius: 12 }} 
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} name={isIt ? "Modelli" : "Models"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LATO ERA STORICA PIE CHART (5 colonne) */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between shadow-md relative min-h-[350px]">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
              <span>🕒</span> {isIt ? "DISTRIBUZIONE ERE STORICHE" : "HISTORICAL ERAS DISTRIBUTION"}
            </h3>

            <div className="w-full h-56 mt-4 relative z-10 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eraPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {eraPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontFamily: "monospace", fontSize: 11, borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* LEGENDA ERE DETTAGLIATA */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono">
              {eraPieData.map((era, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-350">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: era.color }}></span>
                  <span className="truncate font-bold uppercase" title={era.name}>
                    {era.name}: <strong>{era.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
