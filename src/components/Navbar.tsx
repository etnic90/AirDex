"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ lang }: { lang: string }) {
  const pathname = usePathname();

  // Funzione per capire se il bottone è "attivo" in questo momento
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-900/80 border-b border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Titolo del Gioco */}
          <div className="flex-shrink-0">
            <Link 
              href={`/${lang}`} 
              className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] uppercase"
            >
              AirDex
            </Link>
          </div>

          {/* Menu di Navigazione */}
          <div className="flex space-x-6">
            <Link 
              href={`/${lang}`}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${
                isActive(`/${lang}`) 
                  ? 'text-white bg-cyan-950/50 shadow-[inset_0px_0px_10px_rgba(34,211,238,0.2)] border border-cyan-800/50' 
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
            >
              Hangar Globale
            </Link>
            <Link 
              href={`/${lang}/profile`}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${
                isActive(`/${lang}/profile`) 
                  ? 'text-white bg-cyan-950/50 shadow-[inset_0px_0px_10px_rgba(34,211,238,0.2)] border border-cyan-800/50' 
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
            >
              Profilo Pilota
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}