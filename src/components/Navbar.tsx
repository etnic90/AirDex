"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ lang }: { lang: string }) {
  const pathname = usePathname();

  // Helper per evidenziare la rotta attiva
  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
      {/* 
        Il contenitore ora usa w-full e px-6/md:px-10 per allinearsi perfettamente 
        con i bordi laterali della pagina Radar e delle altre schermate.
      */}
      <div className="w-full px-6 md:px-10 mx-auto flex items-center justify-between h-20">
        
        {/* LOGO METALLICO */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link href={`/${lang}`} className="flex items-center gap-2 group">
            {/* Logo in stile gradiente argento/bianco */}
            <span className="text-3xl font-black tracking-widest bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent uppercase group-hover:from-cyan-100 group-hover:to-cyan-500 transition-all duration-500">
              AirDex
            </span>
          </Link>
        </div>

        {/* MENU CENTRALE (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          <Link 
            href={`/${lang}`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/radar') || isActive('/compare') || isActive('/stats') ? 'text-slate-400 hover:text-white' : 'text-cyan-400 font-bold'}`}
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
            href={`/${lang}/compare`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/compare') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Confronto
          </Link>
          <Link 
            href={`/${lang}/stats`} 
            className={`text-sm font-mono tracking-widest uppercase transition-colors ${isActive('/stats') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Telemetria
          </Link>
        </div>

        {/* MENU DESTRA (Profilo e PRO) */}
        <div className="flex items-center gap-4">
          <Link 
            href={`/${lang}/profile`} 
            className="hidden md:block text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            Profilo Pilota
          </Link>
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