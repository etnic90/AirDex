"use client";

import Link from "next/link";
import React from "react";

export default function Footer({ lang }: { lang: string }) {
  const isIt = lang === "it";

  return (
    <footer className="relative bg-slate-950 border-t border-slate-900 mt-24 pt-16 pb-12 overflow-hidden z-10 font-sans">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      
      {/* Visual cathode horizontal scanning scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,182,212,0.01)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none" />

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10 px-4 md:px-10">
        
        {/* TOP LAYOUT: FEATURED TELEMETRY WIDGET & LINKS INDEX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-slate-900">
          
          {/* LEFT AREA: BRAND & FEATURED TELEMETRY CONSOLE (4 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent uppercase font-mono">
                AirDex
              </span>
              <p className="text-slate-400 text-sm mt-3.5 leading-relaxed max-w-md">
                {isIt 
                  ? "L'enciclopedia e registro di navigazione dell'aviazione civile. Telemetrie, piste magnetizzate e flotte commerciali."
                  : "The civil aviation encyclopedia and flight registry. Operational telemetry, magnetized runways, and fleet statistics."}
              </p>
            </div>

            {/* Featured Telemetria Widget Block */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group shadow-inner">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
              
              <div className="flex flex-col gap-3.5 relative z-10">
                <div>
                  <span className="text-cyan-400 font-mono text-[10px] font-black uppercase tracking-widest block mb-1">
                    System Telemetry Module
                  </span>
                  <h5 className="text-white font-extrabold text-sm uppercase">
                    {isIt ? "Consolle Analisi di Rete" : "Global Fleet Statistics"}
                  </h5>
                  <p className="text-slate-450 text-xs mt-1.5 leading-relaxed">
                    {isIt 
                      ? "Statistiche della flotta globale, quote tangenziali medie, ripartizione motori e indice di rarità."
                      : "Analyze global flight stats, average flight ceilings, engine ratios, and rarity metrics."}
                  </p>
                </div>
                
                <Link 
                  href={`/${lang}/stats`} 
                  className="w-max px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-all shadow-sm"
                >
                  {isIt ? "Apri Telemetria Globale" : "Access Live Telemetry"}
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT AREA: 3-COLUMNS INDEX (7 columns) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            
            {/* COLUMN 1: NAVIGATION */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
                {isIt ? "Navigazione" : "Navigation"}
              </h4>
              <div className="flex flex-col gap-2 text-sm font-mono">
                <Link href={`/${lang}`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Hangar
                </Link>
                <Link href={`/${lang}/radar`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Radar
                </Link>
                <Link href={`/${lang}/airlines`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  {isIt ? "Compagnie" : "Airlines"}
                </Link>
                <Link href={`/${lang}/airports`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  {isIt ? "Aeroporti" : "Airports"}
                </Link>
                <Link href={`/${lang}/compare`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  {isIt ? "Confronto" : "Compare"}
                </Link>
                <Link href={`/${lang}/timeline`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  {isIt ? "Cronologia" : "Timeline"}
                </Link>
                <Link href={`/${lang}/blog`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  News
                </Link>
              </div>
            </div>

            {/* COLUMN 2: PARTNERSHIPS */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
                {isIt ? "Partner" : "Partners"}
              </h4>
              <div className="flex flex-col gap-2 text-sm font-mono text-slate-400">
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  AeroPress Network
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  World Spotters
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  SimFlight Alliance
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Virtual ATC Group
                </a>
              </div>
            </div>

            {/* COLUMN 3: SOCIAL & SUPPORT */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
                Community
              </h4>
              <div className="flex flex-col gap-2 text-sm font-mono text-slate-400">
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Discord Server
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Instagram
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  YouTube
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                  Reddit
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM AREA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} AirDex OS. {isIt ? "Tutti i diritti riservati." : "All systems secured."}
          </div>
          <div className="flex gap-4">
            <Link href={`/${lang}/pro`} className="text-amber-500/80 hover:text-amber-400 font-bold uppercase transition-all">
              AirDex PRO
            </Link>
            <span>|</span>
            <span className="text-slate-600">
              {isIt ? "Console Avionica v4.2.1" : "Avionics Console v4.2.1"}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
