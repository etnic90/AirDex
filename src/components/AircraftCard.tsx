export default function AircraftCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-5 w-80 shadow-lg border border-slate-700 hover:border-blue-500 transition-all cursor-pointer">
      {/* Intestazione della Card */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Airbus A380-800</h2>
        <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded text-white">LEGENDARY</span>
      </div>
      
      {/* Immagine (per ora un placeholder grigio) */}
      <div className="w-full h-40 bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-slate-400">Immagine Aereo</span>
      </div>

      {/* Dati Tecnici */}
      <div className="space-y-2 text-sm text-slate-300">
        <p><span className="font-semibold text-slate-400">Compagnia:</span> Emirates</p>
        <p><span className="font-semibold text-slate-400">Motori:</span> Engine Alliance GP7200</p>
        <p><span className="font-semibold text-slate-400">Passeggeri:</span> 515</p>
      </div>
    </div>
  );
}