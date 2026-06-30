import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Sfondo Radiale */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950 to-slate-950"></div>
      
      {/* Griglia olografica in background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="z-10 flex flex-col items-center">
        {/* Icona Radar Disconnesso */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-cyan-600/50 mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.485a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-700 tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-mono text-cyan-400 uppercase tracking-[0.3em] mb-6 border-b border-cyan-800/50 pb-4">
          Segnale Radar Perso
        </h2>
        
        <p className="text-slate-400 max-w-md mx-auto mb-10 font-mono text-sm leading-relaxed bg-slate-900/50 p-4 border-l-2 border-cyan-800">
          [ERRORE DI TELEMETRIA] Impossibile localizzare l&apos;aeromobile o la rotta richiesta nei nostri archivi. Il bersaglio potrebbe essere stato declassificato o i server di navigazione non sono allineati.
        </p>
        
        <Link href="/" className="px-8 py-3 bg-cyan-950/50 border border-cyan-700 text-cyan-400 font-mono uppercase tracking-widest text-sm hover:bg-cyan-900 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]">
          Torna al Terminale Principale
        </Link>
      </div>
    </main>
  );
}