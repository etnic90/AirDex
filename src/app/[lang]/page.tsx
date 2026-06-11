import AircraftCard from "../../components/AircraftCard";
import { supabase } from "../../lib/supabase"; // Importiamo la connessione appena creata

// Rendiamo la pagina asincrona per poter aspettare i dati dal DB
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;

  // CHIAMATA AL DATABASE: Selezioniamo tutti gli aerei dalla tabella 'aircrafts'
  const { data: aircrafts, error } = await supabase
    .from('aircrafts')
    .select('*');

  // Se c'è un errore (es. tabella inesistente), stampiamo un messaggio
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
        {/* Usiamo i dati REALI dal database. 
            Mappiamo l'array e creiamo una Card per ogni aereo trovato! */}
        {aircrafts && aircrafts.length > 0 ? (
          aircrafts.map((aircraft) => (
            <AircraftCard key={aircraft.id} />
          ))
        ) : (
          <p className="text-white">Nessun aereo trovato nel database.</p>
        )}
      </div>
    </main>
  );
}