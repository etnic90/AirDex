import AircraftCard from "../components/AircraftCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white tracking-widest uppercase mb-10">
        Aviation Pokedex
      </h1>
      
      {/* Mostriamo tre card come esempio */}
      <div className="flex gap-6 flex-wrap justify-center">
        <AircraftCard />
        <AircraftCard />
        <AircraftCard />
      </div>
    </main>
  );
}