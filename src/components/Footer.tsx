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
          
          {/* LEFT AREA: BRAND & DESCRIPTION (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent uppercase font-mono">
                AirDex
              </span>
              <p className="text-slate-400 text-sm mt-3.5 leading-relaxed max-w-md">
                {isIt 
                  ? "L'enciclopedia e registro di navigazione dell'aviazione civile. Telemetrie, piste magnetizzate e flotte commerciali. AirDex offre un archivio esaustivo di velivoli storici e moderni, rotte, hub e dettagli sulle compagnie aeree globali per spotter ed appassionati di aviazione."
                  : "The civil aviation encyclopedia and flight registry. Operational telemetry, magnetized runways, and fleet statistics. AirDex offers an exhaustive archive of historical and modern aircraft, routes, hubs, and global airline details built for plane spotters and aviation enthusiasts."}
              </p>
              <p className="text-slate-500 text-xs mt-4 leading-relaxed max-w-md font-mono">
                {isIt 
                  ? "Esplora, confronta ed analizza le schede dei velivoli e i flussi radar costantemente aggiornati sul traffico aereo mondiale."
                  : "Explore, compare, and analyze aircraft configurations and live radar feeds updated dynamically for global aviation telemetry."}
              </p>
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
          <div className="flex items-center gap-4">
            <Link href={`/${lang}/pro`} className="text-amber-500/80 hover:text-amber-400 font-bold uppercase transition-all">
              AirDex PRO
            </Link>
            <span>|</span>
            <Link href={`/${lang}/stats`} className="text-slate-600 hover:text-cyan-400 transition-colors uppercase">
              {isIt ? "Telemetria" : "Telemetry"}
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
