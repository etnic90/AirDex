"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  
  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMessage("Caricamento...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage("Errore: " + error.message);
    else setMessage("Registrazione ok! Controlla la tua email per confermare.");
  };

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMessage("Accesso in corso...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setMessage("Errore: " + error.message);
    } else {
      setMessage("Accesso effettuato! Reindirizzamento...");
      // HARD REDIRECT: Forza il browser verso la VERA pagina profilo
      window.location.assign("/it/profile");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-widest uppercase">
          AirDex Access
        </h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && <p className="text-amber-500 text-sm text-center font-semibold">{message}</p>}

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={handleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors"
            >
              Login
            </button>
            <button 
              type="button" 
              onClick={handleSignUp}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded transition-colors"
            >
              Registrati
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}