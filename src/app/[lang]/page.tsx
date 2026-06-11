import AircraftCard from "../../components/AircraftCard";
import { supabase } from "../../lib/supabase";
import { Aircraft } from "../../types";

export default async function Home() {
  const { data, error } = await supabase.from('aircrafts').select('*');
  const aircrafts = data as Aircraft[];

  if (error) console.error("Errore Database:", error.message);

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Container della Hangar con cornice Glassmorphism */}
      <div className="flex gap-10 flex-wrap justify-center mt-12">
        {aircrafts && aircrafts.length > 0 ? (
          aircrafts.map((aircraft) => (
            <AircraftCard key={aircraft.id} aircraft={aircraft} />
          ))
        ) : (
          <p className="text-cyan-400 font-mono animate-pulse tracking-widest mt-24">
            &gt; SCANSIONE HANGAR IN CORSO... NESSUN VELIVOLO RILEVATO.
          </p>
        )}
      </div>
    </main>
  );
}