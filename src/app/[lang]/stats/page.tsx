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

export default function StatsDashboard() {
  const [data, setData] = useState<StatModel[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStats = async () => {
      const { data: rawData, error } = await supabase
        .from("aircraft_models")
        .select("range_km, max_passengers, first_flight_year, status, manufacturers(name)");

      if (!error && rawData) {
        setData(rawData as unknown as StatModel[]);
      }
      setLoading(false);
    };

    fetchStats();
  }, [supabase]);

  // --- MOTORE STATISTICO (Calcoli Live) ---
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    let totalRange = 0;
    let rangeCount = 0;
    let totalPax = 0;
    let paxCount = 0;

    let activeCount = 0;
    let historicCount = 0;

    const eras = { pioneers: 0, golden: 0, jetage: 0, modern: 0 };
    const mfgCount: Record<string, number> = {};

    data.forEach((plane) => {
      // 1. Medie
      if (plane.range_km) {
        totalRange += plane.range_km;
        rangeCount++;
      }
      if (plane.max_passengers) {
        totalPax += plane.max_passengers;
        paxCount++;
      }

      // 2. Status
      if (plane.status === "ACTIVE") activeCount++;
      if (plane.status === "HISTORIC") historicCount++;

      // 3. Epoche
      const year = plane.first_flight_year;
      if (year) {
        if (year < 1946) eras.pioneers++;
        else if (year <= 1957) eras.golden++;
        else if (year <= 1999) eras.jetage++;
        else eras.modern++;
      }

      // 4. Costruttori
      const mfg = plane.manufacturers?.name || "Unknown";
      mfgCount[mfg] = (mfgCount[mfg] || 0) + 1;
    });

    // Formattazione per i grafici
    const eraData = [
      { name: "Pionieri ('10-'45)", value: eras.pioneers },
      { name: "Età d'Oro ('46-'57)", value: eras.golden },
      { name: "Era Jet ('58-'99)", value: eras.jetage },
      { name: "Moderna (2000+)", value: eras.modern },
    ];

    const statusData = [
      { name: "Attivi", value: activeCount },
      { name: "Storici", value: historicCount },
    ];

    // Prendi la Top 5 dei costruttori
    const topManufacturers = Object.entries(mfgCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAircraft: data.length,
      avgRange: rangeCount > 0 ? Math.round(totalRange / rangeCount) : 0,
      avgPax: paxCount > 0 ? Math.round(totalPax / paxCount) : 0,
      eraData,
      statusData,
      topManufacturers,
    };
  }, [data]);

  if (loading || !stats) {
    return <div className="min-h-screen bg-slate-950 text-cyan-500 flex items-center justify-center font-mono animate-pulse">Scaricamento Dati Globali...</div>;
  }

  const COLORS = ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-[1600px] w-[95%] mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Global Telemetry</h1>
          <p className="text-cyan-500 font-mono text-sm uppercase tracking-widest">
            Analisi Dati Rete AirDex
          </p>
        </div>

        {/* KPI Olografici (Cards superiori) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-sans">
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-cyan-500 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-slate-450 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Vettori Archiviati</h3>
            <p className="text-4xl font-extrabold text-white tracking-tight">{stats.totalAircraft}</p>
          </div>
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-purple-500 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-slate-450 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Autonomia Media</h3>
            <p className="text-4xl font-extrabold text-white tracking-tight">{stats.avgRange.toLocaleString()} <span className="text-lg text-purple-400 font-sans font-bold">km</span></p>
          </div>
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 border-b-4 border-b-emerald-500 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-slate-455 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Capienza Media</h3>
            <p className="text-4xl font-extrabold text-white tracking-tight">{stats.avgPax} <span className="text-lg text-emerald-400 font-sans font-bold">PAX</span></p>
          </div>
        </div>

        {/* Griglia Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Grafico: Era Storica (BarChart) */}
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
            <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
              Distribuzione Temporale
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eraData}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: '#0f172a' }} 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#06b6d4', fontFamily: 'monospace' }} 
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafico: Status Operativo (Donut Chart) */}
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
            <h3 className="text-purple-400 font-mono text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
              Stato Operativo Flotta
            </h3>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell key="cell-active" fill="#10b981" />  {/* Emerald per Attivi */}
                    <Cell key="cell-historic" fill="#f59e0b" /> {/* Amber per Storici */}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#fff', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda Custom per la Donut */}
            <div className="flex justify-center gap-6 mt-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Attivi</div>
              <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Storici (Ritirati)</div>
            </div>
          </div>

          {/* Grafico: Top 5 Costruttori */}
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-800 lg:col-span-2 shadow-xl backdrop-blur-xl">
            <h3 className="text-blue-450 font-mono text-xs uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
              Egemonia Costruttori (Top 5)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topManufacturers} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'sans-serif', fontWeight: 'bold' }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#0f172a' }} 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#3b82f6', fontFamily: 'monospace' }} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {stats.topManufacturers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}