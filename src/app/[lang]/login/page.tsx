"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params?.lang || "en";

  const [mode, setMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState(""); // Callsign facoltativo al signup
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Verifica se c'è già una sessione attiva
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        router.push(`/${lang}/profile`);
      }
    };
    checkSession();
  }, [supabase, lang, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMessage("Inizializzazione decrittazione firma radar...");
    setMessageType("info");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage("Errore di autorizzazione: " + error.message);
      setMessageType("error");
      setLoading(false);
    } else {
      setMessage("Firma digitale autenticata! Accesso in corso...");
      setMessageType("success");
      
      // Controlla se l'utente è admin ed effettua il redirect
      setTimeout(() => {
        window.location.assign(`/${lang}/profile`);
      }, 1000);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!privacyChecked) {
      setMessage("Devi accettare l'Informativa sulla Privacy per registrarti.");
      setMessageType("error");
      return;
    }
    setLoading(true);
    setMessage("Registrazione credenziali nel database radar...");
    setMessageType("info");

    // Registrazione utente
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${lang}/profile`
      }
    });

    if (error) {
      setMessage("Errore di registrazione: " + error.message);
      setMessageType("error");
      setLoading(false);
    } else {
      setMessage("Firma radar salvata! Controlla la tua casella di posta per confermare.");
      setMessageType("success");
      setLoading(false);
      
      if (data.user) {
        const profileUpdates: any = {
          privacy_accepted: true,
          newsletter_subscribed: newsletterChecked
        };
        if (callsign.trim()) {
          profileUpdates.pilot_callsign = callsign.toUpperCase();
        }
        await supabase
          .from("user_profiles")
          .update(profileUpdates)
          .eq("id", data.user.id);
      }
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage("Invio link di reset della chiave radar...");
    setMessageType("info");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${lang}/profile`
    });

    if (error) {
      setMessage("Errore invio email: " + error.message);
      setMessageType("error");
    } else {
      setMessage("Link di ripristino inviato! Controlla la posta elettronica.");
      setMessageType("success");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setMessage("Collegamento con il database di sicurezza Google...");
    setMessageType("info");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${lang}/profile`
      }
    });
    if (error) {
      setMessage("Errore OAuth: " + error.message);
      setMessageType("error");
    }
  };

  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500 font-mono">
        <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-6"></div>
        <p className="text-sm tracking-[0.3em] animate-pulse">REINDIRIZZAMENTO ALL'HANGAR...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Sfondo Griglia Radar */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
        {/* Header Terminale */}
        <div className="text-center mb-8 font-mono">
          <div className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-2 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Aviation AirDex Terminal
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Terminal Accesso
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-900 mb-6 font-mono text-[10px] tracking-widest uppercase">
          <button
            onClick={() => { setMode("signin"); setMessage(""); }}
            className={`flex-1 py-2 rounded-lg transition-all font-bold ${
              mode === "signin" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode("signup"); setMessage(""); }}
            className={`flex-1 py-2 rounded-lg transition-all font-bold ${
              mode === "signup" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Registrati
          </button>
          <button
            onClick={() => { setMode("recovery"); setMessage(""); }}
            className={`flex-1 py-2 rounded-lg transition-all font-bold ${
              mode === "recovery" ? "bg-slate-900 text-cyan-400 shadow-md border border-slate-850" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Reset
          </button>
        </div>

        {/* Feedback log */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border font-mono text-xs text-center transition-all ${
            messageType === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" :
            messageType === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleRecovery} className="space-y-4 font-mono">
          <div>
            <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Canale Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilota@airdex.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-800"
              required
            />
          </div>
          
          {mode !== "recovery" && (
            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Chiave Accesso (Password)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-800"
                required
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-black mb-2">Callsign Pilota (Opzionale)</label>
                <input 
                  type="text" 
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="ES. I-MAVERICK"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-800"
                />
                <p className="text-[8px] text-slate-600 mt-1 leading-snug">Configura la tua firma radio per le trasmissioni.</p>
              </div>

              {/* Privacy Consent */}
              <div className="flex items-start gap-3 mt-4 text-[10px] text-slate-400 select-none">
                <input
                  type="checkbox"
                  id="privacyChecked"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  required
                />
                <label htmlFor="privacyChecked" className="leading-snug cursor-pointer">
                  Accetto l'Informativa sulla Privacy ed acconsento al trattamento dei dati. <span className="text-red-500 font-bold">*</span>
                </label>
              </div>

              {/* Newsletter Consent */}
              <div className="flex items-start gap-3 text-[10px] text-slate-400 select-none">
                <input
                  type="checkbox"
                  id="newsletterChecked"
                  checked={newsletterChecked}
                  onChange={(e) => setNewsletterChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                />
                <label htmlFor="newsletterChecked" className="leading-snug cursor-pointer">
                  Desidero iscrivermi alla newsletter AvGeek per ricevere segnali radar e info travel hacks.
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/10"
          >
            {loading && <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>}
            <span>
              {mode === "signin" ? "Autentica Licenza" : mode === "signup" ? "Registra Nuova Licenza" : "Richiedi Ripristino"}
            </span>
          </button>
        </form>

        {/* Divisore per Social Logins */}
        <div className="relative my-8 font-mono">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-wider">
            <span className="bg-slate-950 px-3 text-slate-500">Oppure firma con</span>
          </div>
        </div>

        {/* Bottone Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-slate-300 font-mono py-3 rounded-xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-inner"
        >
          {/* Icona Google SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Cloud Network
        </button>

        {/* Back Link */}
        <div className="text-center mt-8 font-mono text-[9px] uppercase tracking-widest">
          <Link href={`/${lang}`} className="text-slate-500 hover:text-cyan-400 transition-colors">
            &larr; Ritorna alla Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}