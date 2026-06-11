import { Aircraft } from "../types";

// Diciamo alla Card che per funzionare ha bisogno di ricevere un oggetto "aircraft"
interface AircraftCardProps {
  aircraft: Aircraft;
}

export default function AircraftCard({ aircraft }: AircraftCardProps) {
  // Funzione rapida per decidere il colore del badge in base alla rarità (Stile Videogioco)
  const getRarityColor = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY': return 'bg-amber-500';
      case 'RARE': return 'bg-purple-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-5 w-80 shadow-lg border border-slate-700 hover:border-blue-500 transition-all cursor-pointer">
      {/* Intestazione della Card Dinamica */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white truncate max-w-[180px]" title={aircraft.model_name}>
          {aircraft.model_name}
        </h2>
        <span className={`${getRarityColor(aircraft.rarity)} text-[10px] font-bold px-2 py-1 rounded text-white tracking-wider`}>
          {aircraft.rarity}
        </span>
      </div>
      
      {/* Immagine Placeholder con Codice ICAO */}
      <div className="w-full h-40 bg-slate-700 rounded-lg mb-4 flex flex-col items-center justify-center text-slate-400">
        <span className="text-sm font-semibold">ICAO: {aircraft.icao_code || 'N/A'}</span>
      </div>

      {/* Dati Tecnici Dinamici */}
      <div className="space-y-2 text-sm text-slate-300">
        <p><span className="font-semibold text-slate-400">Compagnia:</span> {aircraft.airline}</p>
        <p><span className="font-semibold text-slate-400">Motori:</span> {aircraft.engines || 'Dato non disponibile'}</p>
        <p><span className="font-semibold text-slate-400">Passeggeri:</span> {aircraft.passengers || 'N/A'}</p>
      </div>
    </div>
  );
}