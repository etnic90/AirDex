import { AircraftModel } from "../types"; 
import Link from "next/link";

interface AircraftCardProps {
  aircraft: AircraftModel;
  lang: string; 
}

export default function AircraftCard({ aircraft, lang }: AircraftCardProps) {
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

  const cardBorderAndGlow = aircraft.rarity && rarityColors[aircraft.rarity]
    ? rarityColors[aircraft.rarity]
    : 'border-slate-700/50 hover:border-cyan-600/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]';

  // Status Badge Colors
  const isHistoric = aircraft.status === 'HISTORIC';
  const statusColor = isHistoric 
    ? 'text-amber-500/80 border-amber-900/50 bg-amber-950/30' 
    : 'text-emerald-500/80 border-emerald-900/50 bg-emerald-950/30';

  return (
    <Link href={`/${lang}/aircraft/${aircraft.id}`} className="block transition-transform hover:scale-[1.02]">
      <div className={`relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 w-96 border transition-all duration-300 overflow-hidden group ${cardBorderAndGlow}`}>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white truncate max-w-[220px]" title={aircraft.model_name}>
              {aircraft.model_name}
            </h2>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mt-1">
              {manufacturerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border bg-slate-800/80 border-slate-600 text-slate-300">
              {aircraft.type || 'N/A'}
            </span>
            {(aircraft.status) && (
              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border ${statusColor}`}>
                {aircraft.status}
              </span>
            )}
          </div>
        </div>
        
        {/* Immagine con Fallback Olografico */}
        <div className="w-full h-48 bg-cyan-950/10 rounded-xl mb-6 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`Livrea ${aircraft.model_name}`} 
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:15px_15px] opacity-40" />
              <span className="text-cyan-700/50 font-mono text-sm tracking-widest z-10">BLUEPRINT STANDBY</span>
            </>
          )}
        </div>

        <div className="space-y-3 font-mono text-sm text-cyan-100/70">
          <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
            <span className="text-cyan-600 font-bold uppercase">Motori</span>
            <span className="text-white text-right truncate max-w-[160px]">{aircraft.engines || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
            <span className="text-cyan-600 font-bold uppercase">Capienza Max</span>
            <span className="text-white text-right">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
            <span className="text-cyan-600 font-bold uppercase">Autonomia</span>
            <span className="text-white text-right">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-cyan-600 font-bold uppercase">Primo Volo</span>
            <span className="text-white text-right">{aircraft.first_flight_year || 'N/A'}</span>
          </div>
        </div>
        
      </div>
    </Link>
  );
}