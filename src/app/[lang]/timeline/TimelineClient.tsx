"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AircraftModel } from "@/types";

const ERAS = [
  {
    id: "pioneers",
    title: "Pionieri dell'Aria",
    years: "1910 - 1945",
    description: "Dagli albori del volo controllato alla fine della Seconda Guerra Mondiale. Un'epoca caratterizzata da telai in legno, tela, motori a pistoni e innovazioni pionieristiche che hanno trasformato il volo da esperimento a industria globale.",
    color: "border-amber-500/30 text-amber-400 bg-amber-950/10 hover:border-amber-400",
    activeColor: "border-amber-500 bg-amber-950/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    glow: "bg-amber-500 shadow-[0_0_10px_#f59e0b]",
    icon: "🛩️",
    milestones: [
      { year: 1914, text: "Inizia il primo servizio passeggeri commerciale al mondo a Tampa Bay, Florida." },
      { year: 1919, text: "Inaugurazione dei collegamenti aerei regolari internazionali tra Londra e Parigi." },
      { year: 1935, text: "Il Douglas DC-3 effettua il primo volo, rendendo il trasporto aereo passeggeri profittevole senza sussidi statali." },
      { year: 1939, text: "Il primo aereo a reazione della storia, l'Heinkel He 178, solca i cieli." }
    ]
  },
  {
    id: "golden",
    title: "Età d'Oro dell'Elica",
    years: "1946 - 1957",
    description: "Il boom transoceanico del secondo dopoguerra. I grandi aerei commerciali a elica, dotati di cabine pressurizzate e motori a pistoni radiali giganti, collegano i continenti nel massimo lusso disponibile.",
    color: "border-yellow-500/30 text-yellow-400 bg-yellow-950/10 hover:border-yellow-400",
    activeColor: "border-yellow-500 bg-yellow-950/30 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    glow: "bg-yellow-500 shadow-[0_0_10px_#eab308]",
    icon: "📜",
    milestones: [
      { year: 1947, text: "Il leggendario Lockheed Constellation riduce i tempi di viaggio transatlantico a sole 15 ore." },
      { year: 1949, text: "Il de Havilland Comet, primo aereo di linea commerciale a reazione (jet) al mondo, effettua il primo volo." },
      { year: 1952, text: "Il Comet entra in servizio di linea, dimezzando i tempi di volo rispetto ai motori a pistone." },
      { year: 1956, text: "Il Douglas DC-7C 'Seven Seas' consente per la prima volta voli non-stop in entrambe le direzioni dell'Atlantico." }
    ]
  },
  {
    id: "jetage",
    title: "Rivoluzione dei Jet",
    years: "1958 - 1999",
    description: "La velocità cancella i confini geografici. I turbogetti aprono le porte al turismo di massa globale, culminando con la comparsa del Boeing 747 Jumbo Jet e il mito del volo civile supersonico del Concorde.",
    color: "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:border-purple-400",
    activeColor: "border-purple-500 bg-purple-950/30 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    glow: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
    icon: "✈️",
    milestones: [
      { year: 1958, text: "Il Boeing 707 entra in servizio regolare transatlantico con Pan Am, inaugurando la Jet Age di massa." },
      { year: 1969, text: "Il Concorde supersonico e il Boeing 747 'Jumbo Jet' effettuano i loro primi storici voli." },
      { year: 1976, text: "Il Concorde entra ufficialmente in servizio commerciale contemporaneamente con British Airways ed Air France." },
      { year: 1988, text: "Il Boeing 747-400 vola per la prima volta, introducendo l'era dei voli ultra-lunghi ad alta capacità." }
    ]
  },
  {
    id: "modern",
    title: "Modernità e Widebody",
    years: "2000 - Oggi",
    description: "L'era dell'efficienza climatica e dei super-jumbo. I vettori aerei si concentrano sull'utilizzo di materiali compositi in fibra di carbonio e motori ad altissimo bypass per ridurre emissioni e consumi di carburante.",
    color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:border-cyan-400",
    activeColor: "border-cyan-500 bg-cyan-950/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]",
    glow: "bg-cyan-500 shadow-[0_0_10px_#06b6d4]",
    icon: "📡",
    milestones: [
      { year: 2005, text: "Il superjumbo a doppio ponte Airbus A380 effettua il suo primo volo a Tolosa." },
      { year: 2009, text: "Il Boeing 787 Dreamliner compie il primo decollo, rivoluzionando l'uso della fibra di carbonio." },
      { year: 2013, text: "L'Airbus A350 XWB effettua il primo volo, introducendo standard inediti di aerodinamica avanzata." },
      { year: 2020, text: "L'efficienza dei bimotori Widebody porta al pensionamento anticipato di molti quadrigetti passeggeri." }
    ]
  }
];

export default function TimelineClient({
  initialAircrafts,
  lang
}: {
  initialAircrafts: AircraftModel[];
  lang: string;
}) {
  const [activeEraId, setActiveEraId] = useState<string>("jetage");

  // Seleziona l'epoca attiva
  const activeEra = useMemo(() => {
    return ERAS.find(e => e.id === activeEraId) || ERAS[2];
  }, [activeEraId]);

  // Filtra e raggruppa gli aerei dell'era attiva
  const filteredAircrafts = useMemo(() => {
    return initialAircrafts.filter(plane => {
      const year = plane.first_flight_year || 0;
      if (activeEraId === "pioneers") return year > 0 && year < 1946;
      if (activeEraId === "golden") return year >= 1946 && year <= 1957;
      if (activeEraId === "jetage") return year >= 1958 && year <= 1999;
      if (activeEraId === "modern") return year >= 2000;
      return false;
    });
  }, [initialAircrafts, activeEraId]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-mono pb-24">
      {/* Sfondi ed Effetti Olografici */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.05),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10">
        
        {/* Header Principale */}
        <div className="mb-10 text-center md:text-left border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            Chrono Flight Tracker Active
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none font-mono">
            Timeline Storica
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed mx-auto md:mx-0">
            Esplora l&apos;evoluzione tecnologica dei velivoli civili dal 1910 a oggi, catalogati in base alle epoche chiave del volo.
          </p>
        </div>

        {/* CONTROLLO ERE STORICHE (GRID SUPERIORE) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {ERAS.map((era) => {
            const isActive = era.id === activeEraId;
            return (
              <button
                key={era.id}
                onClick={() => setActiveEraId(era.id)}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between cursor-pointer ${
                  isActive ? era.activeColor : era.color
                }`}
              >
                {/* Micro Bagliore */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/2 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">{era.icon}</span>
                    <span className="text-[10px] font-black tracking-wider opacity-60">{era.years}</span>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">
                    {era.title}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest opacity-80">
                  <span>Vedi Registri</span>
                  <span className="group-hover:translate-x-1.5 transition-transform">&rarr;</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CONTAINER DI DETTAGLIO LINEARE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: FOCUS SULL'EPOCA SELEZIONATA */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md sticky top-28 shadow-xl">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-2">SCHEDA DIAGNOSTICA ERA</span>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeEra.icon}</span>
              <div>
                <h2 className="text-xl font-black text-white uppercase leading-none">{activeEra.title}</h2>
                <span className="text-xs text-slate-500 font-bold font-mono">{activeEra.years}</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 font-mono leading-relaxed mb-8">
              {activeEra.description}
            </p>

            {/* Pietre Miliari Storiche (Milestones) */}
            <div className="border-t border-slate-900 pt-6">
              <h4 className="text-[10px] text-slate-505 font-black uppercase tracking-widest mb-4">
                🏆 PIETRE MILIARI DELL&apos;ERA
              </h4>
              <div className="space-y-4">
                {activeEra.milestones.map((ms, index) => (
                  <div key={index} className="flex gap-4 items-start text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-cyan-400 font-bold shrink-0">
                      {ms.year}
                    </span>
                    <p className="text-slate-400 leading-snug">{ms.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: TIMELINE CARD DEI VELIVOLI */}
          <div className="lg:col-span-8 space-y-8 relative pl-6 md:pl-10">
            {/* Asse della Timeline Verticale */}
            <div className="absolute top-0 left-[27px] md:left-[35px] bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/40 via-purple-500/20 to-transparent pointer-events-none"></div>

            {filteredAircrafts.length > 0 ? (
              filteredAircrafts.map((aircraft) => {
                const hasTrivia = aircraft.trivia && Array.isArray(aircraft.trivia) && aircraft.trivia.length > 0;
                
                // Stile Rarità
                let rarityColor = "border-slate-800 text-slate-400 bg-slate-950/40";
                if (aircraft.rarity === "UNCOMMON") rarityColor = "border-emerald-500/20 text-emerald-400 bg-emerald-950/10";
                if (aircraft.rarity === "RARE") rarityColor = "border-blue-500/20 text-blue-400 bg-blue-950/10";
                if (aircraft.rarity === "EPIC") rarityColor = "border-purple-500/20 text-purple-400 bg-purple-950/10";
                if (aircraft.rarity === "LEGENDARY") rarityColor = "border-amber-500/20 text-amber-500 bg-amber-950/10";

                return (
                  <div 
                    key={aircraft.id} 
                    className="flex gap-6 items-start relative group transition-all duration-300"
                  >
                    
                    {/* Indicatore Temporale Olografico (Glow Dot) */}
                    <div className="absolute left-[1px] md:left-[9px] top-6 w-14 h-14 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">
                      <div className={`w-3 h-3 rounded-full ${activeEra.glow} group-hover:scale-125 transition-transform duration-300`}></div>
                    </div>

                    {/* Scheda Modello Aereo */}
                    <div className="flex-1 bg-slate-900/20 border border-slate-900 hover:border-cyan-500/30 rounded-3xl p-6 backdrop-blur-sm shadow-md hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] transition-all duration-300 flex flex-col md:flex-row gap-6 items-stretch">
                      
                      {/* Thumbnail/Rendering Aereo */}
                      <div className="w-full md:w-44 h-32 md:h-auto rounded-2xl bg-slate-950 border border-slate-900/60 overflow-hidden relative shrink-0 flex items-center justify-center p-2">
                        {aircraft.house_livery_url ? (
                          <Image 
                            src={aircraft.house_livery_url} 
                            alt={aircraft.model_name}
                            fill
                            sizes="180px"
                            className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-center font-mono text-[9px] text-slate-700 uppercase tracking-widest leading-none flex flex-col items-center gap-2">
                            <span>📡 SCANSIONE RADAR</span>
                            <span className="text-[14px]">🛸</span>
                          </div>
                        )}
                        {/* overlay grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                      </div>

                      {/* Info & Spec */}
                      <div className="flex-grow flex flex-col justify-between font-mono text-xs gap-4">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900/60 pb-2.5 mb-2.5">
                            <div>
                              <span className="text-[9px] text-slate-505 uppercase tracking-wider block">
                                {aircraft.manufacturers?.name || "Costruttore"}
                              </span>
                              <h3 className="text-white font-black text-sm uppercase leading-tight group-hover:text-cyan-400 transition-colors">
                                {aircraft.model_name}
                              </h3>
                            </div>
                            
                            {/* Flight Year Badge */}
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-black text-xs shadow-inner">
                              {aircraft.first_flight_year || "—"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-[9px] text-slate-400 font-bold uppercase">
                              {aircraft.type || "Jet"}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${rarityColor}`}>
                              {aircraft.rarity}
                            </span>
                          </div>

                          {/* Trivia o Descrizione Breve */}
                          <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2" title={aircraft.description || ""}>
                            {hasTrivia && aircraft.trivia ? aircraft.trivia[0] : (aircraft.description || "Nessuna telemetria descrittiva registrata per questo vettore.")}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 mt-auto">
                          <div className="flex gap-4 text-[9px] text-slate-500 uppercase">
                            <span>Pax: <strong className="text-slate-350">{aircraft.max_passengers ? `${aircraft.max_passengers} pax` : "—"}</strong></span>
                            <span>Range: <strong className="text-slate-350">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : "—"}</strong></span>
                          </div>
                          
                          <Link 
                            href={`/${lang}/aircraft/${aircraft.id}`}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Dettagli</span>
                            <span>&rarr;</span>
                          </Link>
                        </div>

                      </div>

                    </div>

                  </div>
                );
              })
            ) : (
              <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-16 text-center text-slate-650">
                <span className="text-4xl block mb-4">📡</span>
                <p className="text-sm font-bold uppercase tracking-widest mb-1 text-white">Scansione Vuota</p>
                <p className="text-xs text-slate-500 font-mono">Nessun aereo registrato nel database per questa epoca storica.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
