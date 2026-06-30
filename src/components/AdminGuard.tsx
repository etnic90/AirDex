"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = ["admin@airdex.com", "mirkogalantucci@gmail.com"];

interface AdminGuardProps {
  children: React.ReactNode;
  lang: string;
}

export default function AdminGuard({ children, lang }: AdminGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setAuthorized(false);
        setLoading(false);
        router.push(`/${lang}/login`);
        return;
      }

      const email = session.user.email || "";
      setUserEmail(email);

      if (ADMIN_EMAILS.includes(email)) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, [supabase, lang, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-500 flex flex-col items-center justify-center font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-slate-900 border-l-slate-900 rounded-full animate-spin"></div>
        <span className="tracking-[0.2em] uppercase text-xs animate-pulse">Verifica Credenziali Comando ATC...</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-500 flex flex-col items-center justify-center font-mono p-6 w-full text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="bg-slate-900/60 border border-red-950 p-8 rounded-3xl max-w-md backdrop-blur-xl relative z-10 shadow-2xl">
          <span className="text-4xl block mb-4">⚠️</span>
          <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">Segnale Non Autorizzato</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Il tuo account (<strong className="text-red-400">{userEmail || "Ospite"}</strong>) non possiede i privilegi di comando necessari per accedere al Terminale Admin.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href={`/${lang}/profile`}
              className="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 py-3 rounded-xl transition-all uppercase tracking-widest text-xs font-bold"
            >
              Ritorna all&apos;Hangar Pilota
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.assign(`/${lang}/login`);
              }}
              className="border border-slate-800 text-slate-500 hover:text-slate-300 py-2.5 rounded-xl transition-all uppercase tracking-widest text-[10px]"
            >
              Usa un altro account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
