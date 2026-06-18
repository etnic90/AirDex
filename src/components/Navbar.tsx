"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Helper per evidenziare la rotta attiva
  const isActive = (path: string) => pathname.includes(path);

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
            Radar
          </Link>
          <Link 
            href={`/${lang}/airlines`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/airlines') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Compagnie
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
            <Link 
              href={`/${lang}/profile`} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 text-xs font-mono"
              title="Accedi al tuo Profilo Pilota"
            >
              <span className="text-sm md:text-base select-none">{getAvatarEmoji(profile?.avatar_id)}</span>
              <span className="hidden sm:inline text-slate-300 group-hover:text-white uppercase tracking-wider font-bold">
                {profile?.pilot_callsign || "PILOTA"}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href={`/${lang}/profile`} 
                className="text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors px-3 py-1.5"
              >
                Accedi
              </Link>
              <Link 
                href={`/${lang}/profile?action=signup`} 
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded transition-all shadow-md hover:shadow-cyan-500/20"
              >
                Registrati
              </Link>
            </div>
          )}

          <Link 
            href={`/${lang}/pro`} 
            className="px-4 py-2 rounded bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-500 text-xs font-black tracking-widest uppercase transition-colors shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            PRO
          </Link>
        </div>
      </div>
    </nav>
  );
}