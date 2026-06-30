"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface NavbarProfile {
  avatar_id?: string;
  pilot_callsign?: string;
}

export default function Navbar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<NavbarProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Helper per evidenziare la rotta attiva
  const isActive = (path: string) => pathname.includes(path);

  // Chiude il menu mobile quando cambia la pagina
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Caricamento sessione iniziale
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Carica profilo
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    getInitialSession();

    // Ascolto dei cambiamenti di stato autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getAvatarEmoji = (avatarId?: string) => {
    switch (avatarId) {
      case "cadet": return "🧑‍🚀";
      case "captain": return "👨‍✈️";
      case "commander": return "📡";
      case "fighter": return "🛩️";
      case "drone": return "🛸";
      case "mechanic": return "🔧";
      case "ai_autopilot": return "🤖";
      default: return "👨‍✈️";
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.assign(`/${lang}/profile`);
  };

  return (
    <nav className="bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
      <div className="w-full px-6 md:px-10 mx-auto flex items-center justify-between h-20">
        
        {/* LOGO METALLICO */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link href={`/${lang}`} className="flex items-center gap-2 group">
            <span className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent uppercase group-hover:from-cyan-100 group-hover:to-cyan-500 transition-all duration-500">
              AirDex
            </span>
          </Link>
        </div>

        {/* MENU CENTRALE (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          <Link 
            href={`/${lang}`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/radar') || isActive('/compare') || isActive('/stats') || isActive('/blog') || isActive('/airlines') || isActive('/airports') || isActive('/timeline') ? 'text-slate-400 hover:text-white' : 'text-cyan-400 font-bold'}`}
          >
            Hangar
          </Link>
          <Link 
            href={`/${lang}/radar`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/radar') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Aerei
          </Link>
          <Link 
            href={`/${lang}/airlines`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/airlines') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Aerolinee
          </Link>
          <Link 
            href={`/${lang}/airports`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/airports') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Aeroporti
          </Link>
          <Link 
            href={`/${lang}/compare`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/compare') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Confronto
          </Link>
          <Link 
            href={`/${lang}/timeline`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/timeline') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Timeline
          </Link>
          <Link 
            href={`/${lang}/blog`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/blog') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            News
          </Link>
        </div>

        {/* MENU DESTRA (Profilo e PRO) */}
        <div className="flex items-center gap-4">
          
          {user ? (
            <div className="relative group py-2">
              <Link 
                href={`/${lang}/profile`} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 text-xs font-mono"
                title="Accedi al tuo Profilo Pilota"
              >
                <span className="text-sm md:text-base select-none">{getAvatarEmoji(profile?.avatar_id)}</span>
                <span className="hidden sm:inline text-slate-300 group-hover:text-white uppercase tracking-wider font-bold font-sans">
                  {profile?.pilot_callsign || "PILOTA"}
                </span>
                <span className="text-[8px] text-slate-500 group-hover:text-cyan-400 transition-colors select-none">▼</span>
              </Link>

              {/* MENU DROPDOWN AL PASSAGGIO DEL MOUSE */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl p-2 hidden group-hover:flex flex-col gap-1 z-50 font-mono text-[9px] tracking-wider uppercase">
                <Link 
                  href={`/${lang}/profile`} 
                  className="px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-2 font-bold"
                >
                  <span>📊</span> Profilo Pilota
                </Link>
                <Link 
                  href={`/${lang}/profile?tab=settings`} 
                  className="px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-2 font-bold"
                >
                  <span>⚙️</span> Impostazioni
                </Link>
                {/* Accesso diretto admin per gli amministratori */}
                {user && user.email && ["admin@airdex.com", "mirkogalantucci@gmail.com"].includes(user.email) && (
                  <Link 
                    href={`/${lang}/admin`} 
                    className="px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-2 font-bold"
                  >
                    <span>🛡️</span> Dashboard Admin
                  </Link>
                )}
                <div className="h-px bg-slate-900 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-950/20 transition-colors flex items-center gap-2 font-bold cursor-pointer"
                >
                  <span>🚪</span> Disconnetti
                </button>
              </div>
            </div>
          ) : null}

          {/* Tasto Hamburger per Mobile */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex items-center p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white bg-slate-900/60 focus:outline-none transition-colors ml-4 cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MENU MOBILE SLIDE-DOWN */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-xl px-6 py-6 flex flex-col gap-4 font-mono text-sm tracking-wider uppercase z-50 absolute left-0 top-20 w-full shadow-2xl animate-fade-in border-b border-slate-800/50">
          <Link 
            href={`/${lang}`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/radar') || isActive('/compare') || isActive('/stats') || isActive('/blog') || isActive('/airlines') || isActive('/airports') || isActive('/timeline') ? 'text-slate-400' : 'text-cyan-400 font-bold'}`}
          >
            Hangar
          </Link>
          <Link 
            href={`/${lang}/radar`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/radar') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Aerei
          </Link>
          <Link 
            href={`/${lang}/airlines`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/airlines') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Aerolinee
          </Link>
          <Link 
            href={`/${lang}/airports`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/airports') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Aeroporti
          </Link>
          <Link 
            href={`/${lang}/compare`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/compare') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Confronto
          </Link>
          <Link 
            href={`/${lang}/timeline`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 border-b border-slate-900/50 transition-colors ${isActive('/timeline') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Timeline
          </Link>
          <Link 
            href={`/${lang}/blog`} 
            onClick={() => setIsOpen(false)}
            className={`py-2 transition-colors ${isActive('/blog') ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            News
          </Link>
        </div>
      )}
    </nav>
  );
}