import AircraftCard from "../../components/AircraftCard";
import { supabase } from "../../lib/supabase";
import { AircraftModel } from "../../types";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  // IMPORTANTE: Leggiamo dalla NUOVA tabella aircraft_models
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*, manufacturers(*)');

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
              lang={lang} // Passiamo la lingua correttamente
            />
          ))
        ) : (
          <p className="text-cyan-400 font-mono animate-pulse tracking-widest mt-24">
            &gt; DATABASE VUOTO. INSERISCI DATI IN AIRCRAFT_MODELS.
          </p>
        )}
      </div>
    </main>
  );
}