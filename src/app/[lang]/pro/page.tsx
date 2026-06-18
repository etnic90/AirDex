"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params?.lang || "en";

  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(data);
      setLoading(false);
    };

    fetchSession();
  }, [supabase]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCheckoutLoading(true);
    setCheckoutMessage("Verifica fondi sul canale transazionale...");

    // Simula pagamento Stripe
    setTimeout(async () => {
      setCheckoutMessage("Autorizzazione pagamento completata! Aggiornamento licenza...");
      
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_pro: true })
        .eq("id", user.id);

      if (error) {
        setCheckoutMessage("Errore database: " + error.message);
        setCheckoutLoading(false);
      } else {
        setCheckoutMessage("Licenza PRO attivata! Avvio motori hangar...");
        setTimeout(() => {
          window.location.assign(`/${lang}/profile`);
        }, 1500);
      }
    }, 2000);
  };

  const handleCancelPro = async () => {
    if (!confirm("Sei sicuro di voler disattivare la tua licenza PRO? Perderai tutti i vantaggi.")) return;
    setLoading(true);
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_pro: false })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev: any) => prev ? { ...prev, is_pro: false } : null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-500 flex flex-col items-center justify-center font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-slate-900 border-l-slate-900 rounded-full animate-spin"></div>
        <span className="tracking-[0.2em] uppercase text-xs animate-pulse">Caricamento Terminale PRO...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-mono flex flex-col items-center justify-center">
      {/* Sfondo Sci-Fi */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,rgba(245,158,11,0.04),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-4xl w-full relative z-10">
        
        {/* Navigazione Indietro */}
        <div className="mb-8 flex justify-start">
          <Link href={`/${lang}/profile`} className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400 border border-slate-900 hover:border-slate-800 bg-slate-950 px-4 py-2 rounded-lg transition-all shadow-md">
            &larr; Chiudi Terminale PRO
          </Link>
        </div>

        {/* Header Sezione */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] tracking-widest uppercase mb-4 animate-pulse">
            👑 Licenze Speciali AirDex
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
            AirDex PRO Upgrade
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Sblocca la massima firma radar e accedi a funzionalità di tracciamento ed analisi esclusive.
          </p>
        </div>

        {/* TRAVEL HACKS PROMO CARD */}
        <div className="mb-12 bg-gradient-to-r from-purple-900/20 via-slate-900/40 to-cyan-900/20 border border-slate-850 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden backdrop-blur-md shadow-2xl hover:border-cyan-500/20 transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/2 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/2 rounded-full blur-2xl"></div>
          
          <div className="text-center md:text-left">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">PRO HUB EXTRA</span>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">AvGeek Travel Hacks & Rewards</h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Scopri come accumulare miglia reali simulando le spese mensili con le carte di credito co-branded. Ottimizza la tua strategia di volo per sbloccare Lounge ed Upgrade.
            </p>
          </div>
          <Link
            href={`/${lang}/pro/travel-hacks`}
            className="shrink-0 bg-slate-950 hover:bg-slate-905 text-cyan-400 hover:text-cyan-300 px-6 py-3 rounded-xl font-bold font-mono text-xs tracking-widest uppercase border border-slate-800 hover:border-cyan-500/30 transition-all shadow-md group-hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
          >
            💳 Apri Strategie Miglia &rarr;
          </Link>
        </div>

        {/* Griglia Piani */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-12">
          
          {/* Piano FREE */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-slate-850 transition-all">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">REGOLARE</span>
              <h3 className="text-xl font-bold text-slate-300 uppercase">Spotter Cadet</h3>
              <div className="my-6">
                <span className="text-3xl font-black text-white">0€</span>
                <span className="text-slate-500 text-xs font-bold"> / per sempre</span>
              </div>
              <ul className="space-y-4 text-xs text-slate-400 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> Limitato a 3 giocate quiz al giorno
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> Banner pubblicitari attivi
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Tracciamento aerei e compagnie (AirDex)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Statistiche completamento flotta base
                </li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-900">
              <span className="block text-center text-[10px] text-slate-600 uppercase tracking-widest font-black py-3 border border-slate-900 rounded-xl bg-slate-950/40 cursor-default">
                Licenza Attiva Standard
              </span>
            </div>
          </div>

          {/* Piano PRO */}
          <div className="bg-slate-900/40 border border-amber-900/40 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.03)] hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 rounded-full blur-xl"></div>
            <div className="absolute top-4 right-4 text-[9px] font-black px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded uppercase tracking-wider animate-pulse">
              HOT
            </div>

            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block mb-1">ILLIMITATO</span>
              <h3 className="text-xl font-bold text-amber-400 uppercase">Spotter PRO</h3>
              <div className="my-6">
                <span className="text-3xl font-black text-white">3.99€</span>
                <span className="text-slate-500 text-xs font-bold"> / mese</span>
              </div>
              <ul className="space-y-4 text-xs text-slate-300 border-t border-amber-950/40 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">★</span> <strong>Giocate quiz illimitate</strong> (Spotter Trainer)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">★</span> <strong>Esperienza Zero Ads</strong> (Nessun banner radar)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">★</span> <strong>Badge PRO Dorato</strong> olografico sulla licenza
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">★</span> Accesso a filtri di telemetria estremi
                </li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-amber-950/40">
              {profile?.is_pro ? (
                <button
                  onClick={handleCancelPro}
                  className="w-full text-center text-[10px] text-red-400 uppercase tracking-widest font-black py-3 border border-red-900/20 rounded-xl bg-red-950/10 hover:bg-red-950/20 transition-all"
                >
                  Disattiva Abbonamento PRO
                </button>
              ) : user ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full text-center text-[10px] text-slate-950 uppercase tracking-widest font-black py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/10 animate-bounce"
                >
                  Attiva Licenza PRO
                </button>
              ) : (
                <Link
                  href={`/${lang}/login`}
                  className="block w-full text-center text-[10px] text-slate-950 uppercase tracking-widest font-black py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition-all"
                >
                  Accedi per Abbonarti
                </Link>
              )}
            </div>
          </div>

        </div>

        {/* MODAL CHECKOUT STRIPE SIMULATOR */}
        {showCheckout && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full relative shadow-2xl">
              
              {/* Bottone Chiudi */}
              <button 
                onClick={() => { setShowCheckout(false); setCheckoutMessage(""); }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <span className="text-[30px] block mb-2">💳</span>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Simulatore Gateway Stripe</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Ambiente di test sicuro. Inserisci qualsiasi valore per autorizzare la licenza PRO.
                </p>
              </div>

              {checkoutMessage && (
                <div className={`mb-6 p-3 rounded-xl border text-[10px] text-center font-mono ${
                  checkoutMessage.includes("Errore") ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  checkoutMessage.includes("attivata") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse" :
                  "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse"
                }`}>
                  {checkoutMessage}
                </div>
              )}

              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs font-mono">
                {/* Dynamic Credit Card Preview Card */}
                <div className="w-full h-40 rounded-xl bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 text-slate-950 p-4 flex flex-col justify-between relative mb-6 font-mono border border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] select-none overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.2),transparent_60%)] opacity-85"></div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 border border-slate-950/15 rounded-full pointer-events-none opacity-40"></div>
                  <div className="absolute -right-10 -bottom-10 w-24 h-24 border border-slate-950/10 rounded-full pointer-events-none opacity-20"></div>

                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black tracking-widest opacity-80 font-mono">AIRDEX SECURE CHIP</span>
                    <span className="text-xl">💳</span>
                  </div>

                  <div className="text-sm font-bold tracking-widest text-slate-950/90 my-2 text-center font-mono">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  <div className="flex justify-between items-end text-[9px] text-slate-950/80">
                    <div>
                      <span className="block text-[7px] tracking-widest uppercase opacity-70">CARDHOLDER</span>
                      <span className="block font-black uppercase truncate max-w-[150px] font-mono">
                        {profile?.pilot_callsign || user?.email?.split('@')[0] || "SPOTTED MEMBER"}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="block text-[7px] tracking-widest uppercase opacity-70">EXPIRE</span>
                        <span className="block font-bold font-mono">{cardExpiry || "MM/YY"}</span>
                      </div>
                      <div>
                        <span className="block text-[7px] tracking-widest uppercase opacity-70">CVC</span>
                        <span className="block font-bold font-mono">{cardCvc || "•••"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[9px] uppercase tracking-widest mb-1.5 font-bold">Numero Carta</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-widest mb-1.5 font-bold">Scadenza</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-widest mb-1.5 font-bold">CVC</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowCheckout(false); setCheckoutMessage(""); }}
                    className="w-1/3 border border-slate-800 text-slate-400 py-3 rounded-xl hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-2/3 bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/10"
                  >
                    {checkoutLoading && <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>}
                    <span>Paga 3.99€</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}