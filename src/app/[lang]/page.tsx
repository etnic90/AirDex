import AircraftCard from "../../components/AircraftCard";
import { supabase } from "../../lib/supabase";
import { AircraftModel } from "../../types";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // IMPORTANTE: Leggiamo dalla tabella aircraft_models
  // Aggiunto ordinamento alfabetico: essenziale per gestire i 2.000 record futuri
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*, manufacturers(*)')
    .order('model_name', { ascending: true });

  const aircrafts = data as unknown as AircraftModel[];

  if (error) console.error("Errore Database:", error.message);

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex gap-10 flex-wrap justify-center mt-12">
        {aircrafts && aircrafts.length > 0 ? (
          aircrafts.map((aircraft) => (
            <AircraftCard 
              key={aircraft.id} 
              aircraft={aircraft} 
              lang={lang}
            />
          ))
        ) : (
          <p className="text-cyan-400 font-mono animate-pulse tracking-widest mt-24">
            &gt; CONNESSIONE DB STABILITA. IN ATTESA DI DATI SUI VELIVOLI...
          </p>
        )}
      </div>
    </main>
  );
}