"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-sm bg-slate-950/70 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Riparato: Usa colori 'amber' nativi */}
          <Link href={`/${lang}`} className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-100 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)] uppercase">
            AirDex
          </Link>
          
          {/* Pulsanti Riparati */}
          <div className="flex space-x-8">
            <Link href={`/${lang}`} className={`px-4 py-2 text-base font-bold tracking-wide transition-all ${isActive(`/${lang}`) ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'text-slate-400 hover:text-amber-300'}`}>
              Hangar Globale
            </Link>
            <Link href={`/${lang}/profile`} className={`px-4 py-2 text-base font-bold tracking-wide transition-all ${isActive(`/${lang}/profile`) ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'text-slate-400 hover:text-amber-300'}`}>
              Profilo Pilota
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}