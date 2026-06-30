"use client"; // Le Error Boundaries devono essere componenti client

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra l'errore in un eventuale servizio di logging (es. Sentry in futuro)
    console.error("Criticità di Sistema:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Sfondo Radiale Rosso Emergenza */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950"></div>
      
      {/* Linea di scansione anomalia */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" />

      <div className="z-10 flex flex-col items-center">
        {/* Icona Avviso */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-600/60 mb-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-700 tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          500
        </h1>
        <h2 className="text-xl md:text-2xl font-mono text-red-500 uppercase tracking-[0.3em] mb-6 border-b border-red-800/50 pb-4">
          Avaria di Sistema
        </h2>
        
        <p className="text-slate-400 max-w-md mx-auto mb-10 font-mono text-sm leading-relaxed bg-slate-900/50 p-4 border-l-2 border-red-800">
          [CRITICITÀ CORE] I sensori hanno rilevato un&apos;anomalia fatale durante l&apos;elaborazione dei dati o la connessione al mainframe. I protocolli di sicurezza sono attivi.
        </p>
        
        <button 
          onClick={() => reset()}
          className="px-8 py-3 bg-red-950/40 border border-red-700 text-red-400 font-mono uppercase tracking-widest text-sm hover:bg-red-900 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
        >
          Tenta Riavvio Sistemi
        </button>
      </div>
    </main>
  );
}