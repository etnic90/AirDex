"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const lang = params?.lang || 'en';

  useEffect(() => {
    const checkUser = async () => {
      // Verifica della sessione attiva nel modulo Auth
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Errore recupero sessione:", error.message);
      }

      if (session && session.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Redirect dinamico basato sulla lingua corrente
    window.location.href = `/${lang}/login`;
  };

  // 1. STATO: Caricamento in corso (Stile Sci-Fi)
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500">
        <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <p className="text-sm font-mono tracking-[0.3em] animate-pulse">DECRIPTANDO SESSIONE...</p>
      </main>
    );
  }

  // 2. STATO: Accesso Negato (Stile Terminale Bloccato)
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="bg-slate-900/80 backdrop-blur-md p-10 rounded-2xl border border-red-900/50 max-w-md text-center shadow-[0_0_40px_rgba(220,38,38,0.1)] relative z-10">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Accesso Negato</h2>
          <p className="text-slate-400 font-mono text-sm mb-8">AUTORIZZAZIONE RICHIESTA PER ACCEDERE ALL'HANGAR CLASSIFICATO.</p>
          <a 
            href={`/${lang}/login`} 
            className="inline-block bg-cyan-950 border border-cyan-800 px-8 py-3 rounded-sm font-mono text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] uppercase tracking-widest text-sm"
          >
            Inizializza Login
          </a>
        </div>
      </main>
    );
  }

  // 3. STATO: Profilo Pilota (Dashboard Operativa)
  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center relative">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-cyan-950/20 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-5xl relative z-10">
        
        {/* Header Profilo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-700/50 shadow-[0_0_25px_rgba(6,182,212,0.05)] mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">
              Terminale Pilota
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <p className="text-cyan-400 font-mono text-sm tracking-wider">{user.email}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleSignOut}
            className="border border-slate-600 text-slate-400 px-6 py-2.5 rounded hover:bg-slate-800 hover:text-white transition font-mono text-sm tracking-widest uppercase w-full md:w-auto"
          >
            Disconnessione
          </button>
        </div>

        {/* AirDex PRO Teaser (Monetization Phase 13) */}
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-900/50 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-3 mb-2 tracking-wide">
              AirDex <span className="px-2 py-0.5 bg-amber-500 text-amber-950 text-sm font-black rounded">PRO</span>
            </h2>
            <p className="text-amber-200/60 font-mono text-sm max-w-xl">
              Sblocca l'Hangar Privato. Costruisci la tua flotta personale, traccia i tuoi voli e ottieni l'accesso ai blueprint storici ad alta risoluzione.
            </p>
          </div>
          <button className="relative z-10 bg-amber-500/10 border border-amber-500/50 text-amber-400 px-6 py-3 rounded font-bold hover:bg-amber-500 hover:text-amber-950 transition-all uppercase tracking-widest text-xs whitespace-nowrap">
            Upgrade Sistema
          </button>
        </div>

        {/* Hangar Personale (Empty State) */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-700/50 p-16 text-center border-dashed relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative z-10 flex flex-col items-center">
            <svg className="w-20 h-20 text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-slate-300 font-bold text-xl mb-2 tracking-wider uppercase">Spazio Hangar Disponibile</p>
            <p className="text-slate-500 font-mono text-sm max-w-md mx-auto">
              Nessun velivolo assegnato a questo ID Pilota. L'acquisizione della flotta privata sarà abilitata nel prossimo aggiornamento dei sistemi.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}