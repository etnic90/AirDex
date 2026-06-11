import AircraftCard from "../../components/AircraftCard";
import { supabase } from "../../lib/supabase";
import { Aircraft } from "../../types"; // Importiamo il tipo

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;

  // Forziamo TypeScript a capire che i dati che arrivano sono un array di Aircraft
  const { data, error } = await supabase
    .from('aircrafts')
    .select('*');
    
  const aircrafts = data as Aircraft[];

  if (error) {
    console.error("Errore Database:", error.message);
  }

  return (
    <main className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      <div className="text-slate-400 text-sm mb-4">Lingua attuale: {resolvedParams.lang}</div>
      
      <h1 className="text-4xl font-bold text-white tracking-widest uppercase mb-10">
        AirDex
      </h1>
      
      <div className="flex gap-6 flex-wrap justify-center">
        {aircrafts && aircrafts.length > 0 ? (
          aircrafts.map((aircraft) => (
            // PASSIAMO L'AEREO REALE COME PROP
            <AircraftCard key={aircraft.id} aircraft={aircraft} />
          ))
        ) : (
          <p className="text-white">Nessun aereo trovato nel database.</p>
        )}
      </div>
    </main>
  );
}