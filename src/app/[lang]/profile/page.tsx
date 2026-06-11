"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Chiediamo al server: "Chi ha in mano le chiavi in questo momento?"
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
    // Dopo il logout, ti rimandiamo alla pagina di login
    window.location.href = "/it/login";
  };

  // 1. STATO: Caricamento in corso
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl font-semibold tracking-wider animate-pulse">VERIFICA CREDENZIALI IN CORSO...</p>
        </div>
      </main>
    );
  }

  // 2. STATO: Accesso Negato (Utente non loggato)
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl border border-amber-500 max-w-md text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Accesso Negato</h2>
          <p className="text-slate-300 mb-6">Devi essere un pilota registrato e con account verificato per accedere all'Hangar.</p>
          <a 
            href="/it/login" 
            className="inline-block bg-blue-600 px-6 py-3 rounded font-bold text-white hover:bg-blue-500 transition-colors shadow-lg"
          >
            Vai al Login
          </a>
        </div>
      </main>
    );
  }

  // 3. STATO: Profilo Pilota (Accesso Consentito)
  return (
    <main className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-1">
              Profilo Pilota
            </h1>
            <p className="text-blue-400 font-mono text-sm">{user.email}</p>
          </div>
          <button 
            type="button"
            onClick={handleSignOut}
            className="border border-slate-600 text-slate-300 px-4 py-2 rounded hover:bg-slate-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-10 text-center border-dashed">
          <p className="text-slate-400 font-semibold mb-2">Il tuo Hangar è vuoto.</p>
          <p className="text-slate-500 text-sm">Il tuo logbook di AirDex inizierà a popolarsi presto.</p>
        </div>
      </div>
    </main>
  );
}