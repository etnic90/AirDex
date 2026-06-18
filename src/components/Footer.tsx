"use client";

import Link from "next/link";
import React from "react";

export default function Footer({ lang }: { lang: string }) {
  const isIt = lang === "it";

  return (
    <footer className="relative bg-slate-950 border-t border-slate-900 mt-20 pt-16 pb-12 overflow-hidden z-10 font-sans">
      {/* Glow ambient background spot inside footer */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Scanning cathode scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,182,212,0.02)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none" />

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10 px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-900">
          
          {/* COLONNA 1: LOGO E DESCRIZIONE */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent uppercase font-mono">
                AirDex
              </span>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {isIt 
                  ? "L'enciclopedia definitiva e il registro di telemetria per l'aviazione civile mondiale. Dati operativi, piste magnetizzate e modelli per veri spotters."
                  : "The definitive encyclopedia and telemetry registry for global civil aviation. Operational specifications, magnetized runways, and historical aircraft."}
              </p>
            </div>

            {/* Status Indicator (Senza Icone/Ping pulsante) */}
            <div className="inline-flex items-center gap-2 px-4 py-2 w-max rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-400 shadow-inner">
              <span className="font-bold uppercase tracking-wider">
                {isIt ? "Sistemi Avionici Online" : "Avionics Core Online"}
              </span>
            </div>
          </div>

          {/* COLONNA 2: NAVIGAZIONE INTERNA */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
              {isIt ? "Indice Principale" : "Main Navigation"}
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm font-mono">
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
              <Link href={`/${lang}/stats`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                {isIt ? "Statistiche" : "Telemetry"}
              </Link>
              <Link href={`/${lang}/timeline`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                {isIt ? "Cronologia" : "Timeline"}
              </Link>
              <Link href={`/${lang}/blog`} className="text-slate-400 hover:text-cyan-400 transition-colors uppercase text-xs tracking-wider">
                News
              </Link>
            </div>
          </div>

          {/* COLONNA 3: PARTNERSHIP AVGEEK */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
              {isIt ? "Partner Affiliati" : "Affiliated Partners"}
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-mono text-slate-400">
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                AeroPress Network
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                World Aviation Spotters
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                SimFlight Alliance
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                Virtual ATC Control Group
              </a>
            </div>
          </div>

          {/* COLONNA 4: SOCIAL & COMMUNITY */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-2 font-mono">
              Community
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-mono text-slate-400">
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                Discord Server
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                Instagram @AirDex
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                YouTube Channel
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors uppercase tracking-wider">
                Reddit Community
              </a>
            </div>
          </div>

        </div>

        {/* PARTE INFERIORE DEL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} AirDex OS v4.2.1. {isIt ? "Tutti i diritti riservati." : "All telemetry secured."}
          </div>
          <div className="flex gap-4">
            <Link href={`/${lang}/pro`} className="text-amber-500/80 hover:text-amber-400 font-bold uppercase transition-all">
              AirDex PRO
            </Link>
            <span>|</span>
            <span className="text-slate-600">
              {isIt ? "Ambiente Sviluppo Attivo" : "Dev-Active Sandbox"}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
