import { Aircraft } from "../types";

interface AircraftCardProps {
  aircraft: Aircraft;
}

export default function AircraftCard({ aircraft }: AircraftCardProps) {
  // Palette standard corretta
  const getRarityStyle = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY': return 'border-amber-600/50 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      case 'EPIC': return 'border-purple-700/50 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]';
      case 'RARE': return 'border-blue-600/50 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]';
      default: return 'border-slate-700/50 hover:border-slate-600 hover:shadow-[0_0_20px_rgba(100,116,139,0.15)]';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY': return 'bg-amber-950/70 border-amber-700 text-amber-200';
      case 'EPIC': return 'bg-purple-950/70 border-purple-700 text-purple-200';
      case 'RARE': return 'bg-blue-950/70 border-blue-700 text-blue-200';
      default: return 'bg-slate-900/70 border-slate-700 text-slate-200';
    }
  };

  const rarityStyle = getRarityStyle(aircraft.rarity);
  const rarityBadgeStyle = getRarityBadge(aircraft.rarity);

  return (
    <div className={`relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 w-96 border ${rarityStyle} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group`}>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white truncate max-w-[220px]" title={aircraft.model_name}>
          {aircraft.model_name}
        </h2>
        <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${rarityBadgeStyle}`}>
          {aircraft.rarity}
        </span>
      </div>
      
      <div className="w-full h-48 bg-cyan-950/10 rounded-xl mb-6 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:15px_15px] opacity-40" />
        <span className="text-cyan-300 font-mono text-2xl tracking-widest z-10 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]">
          {aircraft.icao_code || 'N/A'}
        </span>
      </div>

      <div className="space-y-3 font-mono text-sm text-cyan-100/70">
        <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
          <span className="text-cyan-600 font-bold uppercase">Compagnia</span>
          <span className="text-white text-right">{aircraft.airline}</span>
        </div>
        <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
          <span className="text-cyan-600 font-bold uppercase">Motori</span>
          <span className="text-white text-right truncate max-w-[160px]" title={aircraft.engines || ''}>
            {aircraft.engines || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between pb-1">
          <span className="text-cyan-600 font-bold uppercase">Capienza</span>
          <span className="text-white text-right">{aircraft.passengers || 'N/A'} PAX</span>
        </div>
      </div>
    </div>
  );
}