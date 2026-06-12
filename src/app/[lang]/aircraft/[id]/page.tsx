import { supabase } from "../../../../lib/supabase";
import { AircraftModel } from "../../../../types"; 

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

  // Strategia Immagini: Fallback gerarchico
  const imageUrl = aircraft.house_livery_url || aircraft.launch_customer_livery_url;

  // Status Badge Colors
  const isHistoric = aircraft.status === 'HISTORIC';
  const statusColor = isHistoric 
    ? 'text-amber-500/80 border-amber-900/50 bg-amber-950/30' 
    : 'text-emerald-500/80 border-emerald-900/50 bg-emerald-950/30';

  return (
    <main className="min-h-screen bg-slate-950 p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-slate-800">
        
        {/* Header Sezione */}
        <div className="flex flex-col md:flex-row md:justify-between items-start mb-10 gap-4">
          <div>
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">{aircraft.model_name}</h1>
            <p className="text-cyan-400 font-bold uppercase tracking-widest">
              {aircraft.manufacturers?.name || 'Costruttore Sconosciuto'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-black px-4 py-2 rounded-full uppercase tracking-widest border bg-slate-800/80 border-slate-600 text-slate-300">
              {aircraft.type || 'N/A'}
            </span>
            {aircraft.status && (
              <span className={`text-xs font-black px-3 py-1.5 rounded uppercase tracking-widest border ${statusColor}`}>
                {aircraft.status}
              </span>
            )}
          </div>
        </div>

        {/* Immagine con Fallback Olografico */}
        <div className="w-full h-80 bg-cyan-950/10 rounded-xl mb-10 flex flex-col items-center justify-center border border-cyan-900/40 relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`Livrea ${aircraft.model_name}`} 
              className="absolute inset-0 w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
              <span className="text-cyan-700/50 font-mono text-xl tracking-widest z-10">BLUEPRINT STANDBY</span>
            </>
          )}
        </div>
        
        {/* Griglia Dati Tecnici */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2 md:col-span-1">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Capienza Max</span>
            <span className="text-xl font-bold text-white">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2 md:col-span-1">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Primo Volo</span>
            <span className="text-xl font-bold text-white">{aircraft.first_flight_year || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Motori</span>
            <span className="text-lg font-bold text-white">{aircraft.engines || 'N/A'}</span>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 col-span-2 md:col-span-4">
            <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Autonomia Operativa</span>
            <span className="text-lg font-bold text-cyan-300">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </main>
  );
}