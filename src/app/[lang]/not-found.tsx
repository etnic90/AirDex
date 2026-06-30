"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function NotFound() {
  const params = useParams();
  const lang = params?.lang || "en";

  const text = {
    it: {
      status: "STATO SISTEMA: AVVISO",
      title: "RADAR OFFLINE",
      errorCode: "CODICE_ERRORE:",
      ping: "PING_COGNITIVO:",
      pingValue: "NESSUNA RISPOSTA TRANSPONDER",
      heading: "ROTAZIONE:",
      headingValue: "COORDINATE NON RISOLTE",
      desc: "Il settore dello spazio aereo richiesto non risponde alle frequenze radar. Il velivolo potrebbe aver superato i limiti della griglia di vettoriamento tracciata.",
      backBtn: "RITORNA ALL'HANGAR BASE"
    },
    en: {
      status: "SYSTEM STATUS: WARNING",
      title: "RADAR OFFLINE",
      errorCode: "ERROR_CODE:",
      ping: "COGNITIVE_PING:",
      pingValue: "NO TRANSPONDER RESPONSE",
      heading: "HEADING:",
      headingValue: "UNRESOLVED COORDINATES",
      desc: "The requested airspace sector does not respond to radar frequencies. The aircraft may have exceeded the boundaries of the charted vectoring grid.",
      backBtn: "RETURN TO BASE HANGAR"
    },
    es: {
      status: "ESTADO DEL SISTEMA: ADVERTENCIA",
      title: "RADAR OFFLINE",
      errorCode: "CÓDIGO_ERROR:",
      ping: "PING_COGNITIVO:",
      pingValue: "SIN RESPUESTA DE TRANSPONDEDOR",
      heading: "RUMBO:",
      headingValue: "COORDENADAS NO RESUELTAS",
      desc: "El sector del espacio aéreo solicitado no responde a las frecuencias de radar. La aeronave puede haber superado los límites de la cuadrícula de vectores trazada.",
      backBtn: "VOLVER AL HANGAR BASE"
    },
    fr: {
      status: "STATUT DU SYSTÈME: AVERTISSEMENT",
      title: "RADAR OFFLINE",
      errorCode: "CODE_ERREUR:",
      ping: "PING_COGNITIF:",
      pingValue: "PAS DE RÉPONSE TRANSPONDEUR",
      heading: "CAP:",
      headingValue: "COORDONNÉES NON RÉSOLUES",
      desc: "Le secteur de l'espace aérien demandé ne répond pas aux fréquences radar. L'appareil a peut-être dépassé les limites de la grille de guidage tracée.",
      backBtn: "RETOURNER AU HANGAR DE BASE"
    }
  };

  const t = text[lang as keyof typeof text] || text.en;

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex items-center justify-center p-6 relative overflow-hidden">
      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_100%)] pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none z-20"></div>

      <div className="max-w-md w-full bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-8 backdrop-blur-xl relative z-30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        {/* Decorative HUD corners */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500/50"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500/50"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500/50"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500/50"></div>

        {/* Warning Icon and Header */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-25"></div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-emerald-500/70 tracking-[0.3em] uppercase font-black">{t.status}</span>
            <h1 className="text-2xl font-black tracking-widest text-emerald-300">{t.title}</h1>
          </div>

          <hr className="w-full border-emerald-500/20" />

          {/* Skeuomorphic console output */}
          <div className="w-full bg-slate-950/80 border border-emerald-950 p-4.5 rounded-2xl text-left text-xs space-y-3 font-mono text-emerald-500 shadow-inner">
            <div className="flex justify-between">
              <span className="opacity-60">{t.errorCode}</span>
              <span className="font-bold text-emerald-400">404_ROUTE_NOT_FOUND</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t.ping}</span>
              <span className="text-red-400 font-bold animate-pulse">{t.pingValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">{t.heading}</span>
              <span className="font-bold text-emerald-400">{t.headingValue}</span>
            </div>
            <div className="border-t border-emerald-950 pt-2 opacity-50 text-[10px] leading-relaxed">
              {t.desc}
            </div>
          </div>

          <Link
            href={`/${lang}`}
            className="w-full py-4.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-emerald-400 font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-center text-sm"
          >
            {t.backBtn}
          </Link>
        </div>
      </div>
    </div>
  );
}
