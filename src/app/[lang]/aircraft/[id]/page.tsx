import { supabase } from "../../../../lib/supabase";
import { Aircraft } from "../../../../types";

// Leggiamo sia la lingua che l'ID dell'aereo dall'URL
export default async function AircraftPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Chiediamo a Supabase l'aereo con questo esatto ID
  const { data, error } = await supabase
    .from('aircrafts')
    .select('*')
    .eq('id', id)
    .single(); // .single() dice a Supabase che ci aspettiamo un solo aereo, non una lista

  // Se l'aereo non esiste nell'URL
  if (error || !data) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Aereo non trovato</div>;
  }

  const aircraft = data as Aircraft;

  return (
    <main className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      {/* Container della pagina singola (stile "Scheda Tecnica") */}
      <div className="w-full max-w-2xl bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700">
        <h1 className="text-4xl font-bold text-white mb-2">{aircraft.model_name}</h1>
        <p className="text-blue-500 font-semibold mb-8 uppercase tracking-widest">{aircraft.airline}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700 p-4 rounded-lg">
            <span className="block text-xs text-slate-400 uppercase">Codice ICAO</span>
            <span className="text-xl font-bold text-white">{aircraft.icao_code || 'N/A'}</span>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <span className="block text-xs text-slate-400 uppercase">Passeggeri</span>
            <span className="text-xl font-bold text-white">{aircraft.passengers}</span>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg col-span-2">
            <span className="block text-xs text-slate-400 uppercase">Motori</span>
            <span className="text-lg font-bold text-white">{aircraft.engines}</span>
          </div>
        </div>
      </div>
    </main>
  );
}