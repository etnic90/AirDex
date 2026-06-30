"use client";

import { useState } from "react";
import { AircraftModel } from "../types"; 
import Link from "next/link";
import Image from "next/image";

interface AircraftCardProps {
  aircraft: AircraftModel;
  lang: string; 
}

export default function AircraftCard({ aircraft, lang }: AircraftCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const manufacturerName = aircraft.manufacturers?.name || 'Sconosciuto';
  
  // Strategia Immagini: Fallback gerarchico
  const imageUrl = aircraft.house_livery_url || aircraft.launch_customer_livery_url;

  // Gestione colori rarità dinamici (Sci-Fi Hologram effect)
  const rarityColors: Record<string, string> = {
    COMMON: 'border-slate-500 hover:border-slate-400 hover:shadow-[0_0_25px_rgba(148,163,184,0.15)]',
    UNCOMMON: 'border-green-900/80 hover:border-green-500 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)]',
    RARE: 'border-blue-900/80 hover:border-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
    EPIC: 'border-purple-900/80 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    LEGENDARY: 'border-amber-900/80 hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
  };

  const raritySpots: Record<string, string> = {
    COMMON: 'bg-slate-400/5 group-hover:bg-slate-400/10',
    UNCOMMON: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    RARE: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    EPIC: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    LEGENDARY: 'bg-amber-500/10 group-hover:bg-amber-500/20',
  };

  const cardBorderAndGlow = aircraft.rarity && rarityColors[aircraft.rarity]
    ? rarityColors[aircraft.rarity]
    : 'border-slate-700/50 hover:border-cyan-600/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]';

  const raritySpotClass = aircraft.rarity && raritySpots[aircraft.rarity]
    ? raritySpots[aircraft.rarity]
    : 'bg-cyan-500/10 group-hover:bg-cyan-500/20';

  // Status Badge Colors
  const isHistoric = aircraft.status === 'HISTORIC';
  const statusColor = isHistoric 
    ? 'text-amber-500/80 border-amber-900/50 bg-amber-950/30' 
    : 'text-emerald-500/80 border-emerald-900/50 bg-emerald-950/30';

  return (
    <Link href={`/${lang}/aircraft/${aircraft.id}`} className="block transition-transform hover:scale-[1.03] w-full">
      <div className={`relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border transition-all duration-300 overflow-hidden group ${cardBorderAndGlow}`}>
        {/* Spot sfumato olografico per rarità */}
        <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl transition-all duration-500 pointer-events-none z-0 ${raritySpotClass}`}></div>

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h2 className="text-[28px] font-extrabold text-white truncate max-w-[260px] tracking-tight" title={aircraft.model_name}>
              {aircraft.model_name}
            </h2>
            <p className="text-cyan-400 text-base font-extrabold uppercase tracking-wider mt-1.5 font-sans">
              {manufacturerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            {(aircraft.status) && (
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border font-sans shadow-sm ${statusColor}`}>
                {aircraft.status}
              </span>
            )}
          </div>
        </div>
        
        {/* Immagine con Fallback Olografico Sci-Fi */}
        <div className="w-full h-56 bg-cyan-950/15 rounded-2xl mb-8 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_35px_rgba(6,182,212,0.15)] z-10">
          {imageUrl ? (
            <>
              <Image 
                src={imageUrl} 
                alt={`Livrea ${aircraft.model_name}`} 
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 z-10 ${imageLoaded ? 'opacity-90 group-hover:opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-95'}`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 z-0 animate-shimmer" />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
              {/* Griglia olografica di base */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:15px_15px] opacity-60" />
              
              {/* Icona Radar / Sensore */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-500/70 mb-3 animate-pulse z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              {/* Testo sci-fi */}
              <div className="z-10 flex flex-col items-center text-center">
                <span className="text-cyan-400 font-sans text-xs font-bold tracking-widest bg-slate-900/80 px-3 py-1 rounded border border-cyan-500/20">
                  NO VISUAL DATA
                </span>
                <span className="text-cyan-600/70 font-mono text-xs tracking-widest mt-2 uppercase animate-pulse">
                  Acquisizione in corso...
                </span>
              </div>

              {/* Linea di scansione olografica */}
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/30 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            </div>
          )}
        </div>

        <div className="space-y-3 text-cyan-100 relative z-10">
          <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
            <span className="text-slate-450 font-bold uppercase text-xs tracking-wider font-sans">Motori</span>
            <span className="text-white text-right font-black font-mono truncate max-w-[200px] text-sm md:text-base">{aircraft.engines || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
            <span className="text-slate-450 font-bold uppercase text-xs tracking-wider font-sans">Capienza Max</span>
            <span className="text-white text-right font-black font-mono text-sm md:text-base">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-3 items-center">
            <span className="text-slate-450 font-bold uppercase text-xs tracking-wider font-sans">Autonomia</span>
            <span className="text-white text-right font-black font-mono text-sm md:text-base">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
          </div>
          <div className="flex justify-between pb-1 items-center">
            <span className="text-slate-450 font-bold uppercase text-xs tracking-wider font-sans">Primo Volo</span>
            <span className="text-white text-right font-black font-mono text-sm md:text-base">{aircraft.first_flight_year || 'N/A'}</span>
          </div>
        </div>
        
      </div>
    </Link>
  );
}