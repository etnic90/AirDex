import { AircraftModel } from "../types"; 
import Link from "next/link"; // <--- AGGIUNTO

interface AircraftCardProps {
  aircraft: AircraftModel;
  lang: string; // <--- AGGIUNTO per mantenere la lingua nell'URL
}

export default function AircraftCard({ aircraft, lang }: AircraftCardProps) {
  const manufacturerName = aircraft.manufacturers?.name || 'Sconosciuto';

  return (
    // <--- AGGIUNTO Link qui sotto
    <Link href={`/${lang}/aircraft/${aircraft.id}`} className="block transition-transform hover:scale-[1.02]">
      <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 w-96 border border-slate-700/50 hover:border-cyan-600/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all duration-300 overflow-hidden group">
        
        {/* ... tutto il resto del contenuto della carta rimane UGUALE ... */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white truncate max-w-[220px]" title={aircraft.model_name}>
              {aircraft.model_name}
            </h2>
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mt-1">
              {manufacturerName}
            </p>
          </div>
          <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border bg-slate-800/80 border-slate-600 text-slate-300">
            {aircraft.type || 'N/A'}
          </span>
        </div>
        
        <div className="w-full h-48 bg-cyan-950/10 rounded-xl mb-6 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:15px_15px] opacity-40" />
          <span className="text-cyan-700/50 font-mono text-sm tracking-widest z-10">SPAZIO FOTO</span>
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
          <div className="flex justify-between pb-1">
            <span className="text-cyan-600 font-bold uppercase">Autonomia</span>
            <span className="text-white text-right">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}