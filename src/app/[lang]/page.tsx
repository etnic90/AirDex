import AircraftCard from "../../components/AircraftCard";

// 1. Aggiungiamo 'async' per dire alla funzione di aspettare i dati
// 2. Specifichiamo che i params sono una Promise (una promessa di dati futuri)
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  
  // 3. Estraiamo il valore reale usando 'await'
  const resolvedParams = await params;

  return (
    <main className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      {/* Ora stampiamo il valore risolto */}
      <div className="text-slate-400 text-sm mb-4">Lingua attuale: {resolvedParams.lang}</div>
      
      <h1 className="text-4xl font-bold text-white tracking-widest uppercase mb-10">
        AirDex
      </h1>
      
      <div className="flex gap-6 flex-wrap justify-center">
        <AircraftCard />
        <AircraftCard />
        <AircraftCard />
      </div>
    </main>
  );
}