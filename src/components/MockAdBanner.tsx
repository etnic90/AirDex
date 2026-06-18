"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MockAdBanner() {
  const params = useParams();
  const lang = params?.lang || "en";
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentAdIdx, setCurrentAdIdx] = useState(0);

  const ADS = [
    {
      title: "Microsoft Flight Simulator 2024",
      desc: "Pilota l'A350-1000 con la fisica dei sistemi aggiornata. Disponibile ora l'espansione ufficiale per PC.",
      cta: "Acquista Ora",
      link: "https://www.xbox.com",
      badge: "SIMULATORE SPONSOR",
      badgeColor: "border-purple-500/30 text-purple-400 bg-purple-950/20",
      glowColor: "shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/30"
    },
    {
      title: "Rimuovi Ogni Limite Radar",
      desc: "Stanco dei banner promozionali? Aggiorna alla licenza Spotter PRO a soli 3.99€ al mese per un'esperienza pura.",
      cta: "Aggiorna a PRO 👑",
      link: `/${lang}/pro`,
      badge: "AIRDEX SYSTEM",
      badgeColor: "border-amber-500/30 text-amber-400 bg-amber-950/20 animate-pulse",
      glowColor: "shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500/30"
    },
    {
      title: "Modellismo Storico Boeing 747-400",
      desc: "Replica da collezione in scala 1:200 pressofusa in metallo. Pezzo d'epoca numerato per collezionisti.",
      cta: "Verifica Disponibilità",
      link: "https://www.amazon.it",
      badge: "COLLECTIBLE DEALS",
      badgeColor: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
      glowColor: "shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-500/30"
    }
  ];

  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          setIsPro(false);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("user_profiles")
          .select("is_pro")
          .eq("id", session.user.id)
          .single();

        if (data?.is_pro) {
          setIsPro(true);
        } else {
          setIsPro(false);
        }
      } catch (err) {
        console.error("Errore verifica stato PRO per ads:", err);
      } finally {
        setLoading(false);
      }
    };

    checkProStatus();
    
    // Ruota gli annunci ogni 12 secondi
    const interval = setInterval(() => {
      setCurrentAdIdx(prev => (prev + 1) % ADS.length);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  if (loading || isPro) {
    return null; // I PRO non vedono nessun banner!
  }

  const activeAd = ADS[currentAdIdx];

  return (
    <div className={`w-full max-w-5xl mx-auto mt-12 bg-slate-900/10 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-500 font-mono text-xs ${activeAd.glowColor}`}>
      {/* Laser light scan decoration */}
      <div className="absolute top-0 left-0 w-[150px] h-full bg-gradient-to-r from-transparent via-cyan-500/3 to-transparent -skew-x-12 translate-x-[-150px] animate-[pulse_6s_infinite]"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black px-2 py-0.5 border rounded uppercase tracking-wider ${activeAd.badgeColor}`}>
              {activeAd.badge}
            </span>
            <span className="text-[8px] text-slate-600 uppercase tracking-widest">
              ANNUNCIO RADAR SPONSORIZZATO
            </span>
          </div>
          <h4 className="text-white font-black uppercase text-xs tracking-wider">
            {activeAd.title}
          </h4>
          <p className="text-[10px] text-slate-450 font-sans leading-relaxed">
            {activeAd.desc}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {activeAd.link.startsWith("http") ? (
            <a
              href={activeAd.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white px-5 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all font-bold uppercase tracking-wider text-[10px]"
            >
              {activeAd.cta}
            </a>
          ) : (
            <Link
              href={activeAd.link}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-[10px] shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              {activeAd.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
