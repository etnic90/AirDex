"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const params = useParams();
  const lang = params?.lang || "en";

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Avionic System Exception Captured:", error);
  }, [error]);

  const text = {
    it: {
      status: "ALLARME DI PLANCIA: CRITICO",
      title: "SISTEMI IN AVARIA",
      system: "LOG_DI_SISTEMA:",
      digest: "CODICE_DIGEST:",
      desc: "Rilevata anomalia catastrofica nella telemetria avionica. I circuiti logici principali non rispondono ai parametri di volo.",
      resetBtn: "REINIZIALIZZA SISTEMI AVIONICI",
      backBtn: "RITORNA ALL'HANGAR"
    },
    en: {
      status: "COCKPIT ALARM: CRITICAL",
      title: "AVIONIC SYSTEM FAILURE",
      system: "SYSTEM_EXCEPTION_LOG:",
      digest: "DIGEST_HASH:",
      desc: "Catastrophic anomaly detected in avionic telemetry. The primary logic loops are not responding to standard flight configurations.",
      resetBtn: "REINITIALIZE AVIONIC SYSTEMS",
      backBtn: "RETURN TO HANGAR"
    },
    es: {
      status: "ALARMA DE CABINA: CRÍTICA",
      title: "FALLO DE SISTEMA DE AVIONICA",
      system: "REGISTRO_EXCEPCION:",
      digest: "HASH_DIGEST:",
      desc: "Anomalía catastrófica detectada en la telemetría de aviónica. Los lazos lógicos primarios no responden a las configuraciones de vuelo estándar.",
      resetBtn: "REINICIALIZAR SISTEMAS DE AVIONICA",
      backBtn: "VOLVER AL HANGAR"
    },
    fr: {
      status: "ALARME DE CABINE: CRITIQUE",
      title: "PANNE DU SYSTÈME AVIONIQUE",
      system: "LOG_EXCEPTION_SYSTEME:",
      digest: "HASH_DIGEST:",
      desc: "Anomalie catastrophique détectée dans la télémétrie avionique. Les boucles logiques primaires ne répondent pas aux configurations de vol standard.",
      resetBtn: "RÉINITIALISER LES SYSTÈMES AVIONIQUES",
      backBtn: "RETOURNER AU HANGAR"
    }
  };

  const t = text[lang as keyof typeof text] || text.en;

  return (
    <div className="min-h-screen bg-slate-950 text-amber-500 font-mono flex items-center justify-center p-6 relative overflow-hidden">
      {/* Red/Amber CRT glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_100%)] pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(245,158,11,0.04),rgba(245,158,11,0.02),rgba(245,158,11,0.04))] bg-[size:100%_4px,6px_100%] pointer-events-none z-20"></div>

      <div className="max-w-md w-full bg-slate-900/80 border border-amber-500/40 rounded-3xl p-8 backdrop-blur-xl relative z-30 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
        {/* Decorative HUD corners */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500/50"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500/50"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500/50"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500/50"></div>

        {/* Warning Icon and Header */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-amber-500/30 flex items-center justify-center relative animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-25"></div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-amber-500/70 tracking-[0.3em] uppercase font-black">{t.status}</span>
            <h1 className="text-2xl font-black tracking-widest text-amber-300">{t.title}</h1>
          </div>

          <hr className="w-full border-amber-500/20" />

          {/* Skeuomorphic console output */}
          <div className="w-full bg-slate-950/80 border border-amber-950 p-4.5 rounded-2xl text-left text-xs space-y-3 font-mono text-amber-500 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="opacity-60 text-[10px]">{t.system}</span>
              <span className="font-bold text-red-400 truncate break-all block max-h-12 overflow-y-auto">{error.message || "Unknown Exception"}</span>
            </div>
            {error.digest && (
              <div className="flex justify-between">
                <span className="opacity-60">{t.digest}</span>
                <span className="font-bold text-amber-400 text-[10px]">{error.digest}</span>
              </div>
            )}
            <div className="border-t border-amber-950 pt-2 opacity-50 text-[10px] leading-relaxed">
              {t.desc}
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full py-4.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl text-amber-400 font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-center text-sm cursor-pointer"
            >
              {t.resetBtn}
            </button>

            <a
              href={`/${lang}`}
              className="w-full py-3.5 bg-transparent hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 font-bold tracking-widest uppercase transition-all duration-300 text-center text-xs"
            >
              {t.backBtn}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
