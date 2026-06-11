import { supabase } from "../../../../lib/supabase";
import { AircraftModel } from "../../../../types"; // Importa il nuovo tipo

export default async function AircraftPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Query: prendiamo il modello specifico E i dati del suo costruttore
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*, manufacturers(*)') 
    .eq('id', id)
    .single();

  if (error || !data) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Aereo non trovato nel database</div>;
  }

  const aircraft = data as unknown as AircraftModel;

  return (
    <main className="min-h-screen bg-slate-950 p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-slate-800">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">{aircraft.model_name}</h1>
        <p className="text-cyan-400 font-bold mb-10 uppercase tracking-widest">
          {aircraft.manufacturers?.name || 'Costruttore Sconosciuto'}
        </p>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Tipo Velivolo</span>
            <span className="text-xl font-bold text-white">{aircraft.type || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Capienza Max</span>
            <span className="text-xl font-bold text-white">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Motori</span>
            <span className="text-lg font-bold text-white">{aircraft.engines || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Autonomia Operativa</span>
            <span className="text-lg font-bold text-cyan-300">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </main>
  );
}