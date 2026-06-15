import { Suspense } from "react";
import RadarClient from "./RadarClient";

// 1. Il Guscio Server (Prepara l'involucro e passa la lingua)
export default async function RadarPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-12">
      {/* Sfondo radar globale */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      <div className="max-w-[1600px] w-[95%] mx-auto px-4 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-widest flex items-center gap-4">
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#06b6d4]"></span>
            Radar Centrale
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-2 uppercase tracking-widest">
            Sistema di intercettazione flotte e filtraggio dati
          </p>
        </div>

        {/* 2. Il Nucleo Client (Gira nel browser, intercetta l'URL ed esegue i filtri live) */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-64 text-cyan-500">
            <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            <p className="font-mono text-sm tracking-[0.2em] animate-pulse uppercase">Sincronizzazione Rete Satellitare...</p>
          </div>
        }>
          <RadarClient lang={lang} />
        </Suspense>
      </div>
    </main>
  );
}