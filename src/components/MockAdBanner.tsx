"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

interface MockAdBannerProps {
  modelName?: string;
  manufacturerName?: string;
  operators?: string[];
}

export default function MockAdBanner({ modelName = "", manufacturerName: _manufacturerName = "", operators: _operators = [] }: MockAdBannerProps) {
  const params = useParams();
  const lang = params?.lang || "en";
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentAdIdx, setCurrentAdIdx] = useState(0);

  // Genera annunci contestuali (B2B Nativi) in base all'aereo
  const ADS = useMemo(() => {
    const ads = [];
    const nameLower = modelName.toLowerCase();
    
    if (nameLower.includes("350") || nameLower.includes("a350")) {
      ads.push({
        title: "Qatar Airways — Volo Airbus A350 in Qsuite",
        desc: "Scopri il comfort rivoluzionario della migliore classe Business al mondo. Cabine private a bordo della flotta Airbus A350.",
        cta: "Scopri Qsuite",
        link: "https://www.qatarairways.com",
        badge: "QATAR NATIVE SPONSOR",
        badgeColor: "border-rose-500/30 text-rose-400 bg-rose-950/20",
        glowColor: "shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:border-rose-500/30"
      });
    }
    
    if (nameLower.includes("380") || nameLower.includes("a380") || nameLower.includes("777")) {
      ads.push({
        title: "Emirates Aviation Training Simulator",
        desc: "Prova l'emozione di pilotare l'A380 o il Boeing 777. Prenota la tua sessione nei simulatori FFS Full Flight professionali a Dubai.",
        cta: "Prenota Slot",
        link: "https://www.emirates.com",
        badge: "EMIRATES TRAINING",
        badgeColor: "border-red-500/30 text-red-400 bg-red-950/20",
        glowColor: "shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/30"
      });
    }

    if (nameLower.includes("cessna") || nameLower.includes("piper") || nameLower.includes("aermacchi") || nameLower.includes("m.20") || nameLower.includes("b.308")) {
      ads.push({
        title: "FSA Flight Academy — Diventa Pilota di Linea",
        desc: "Iscrizioni aperte per i corsi ATPL Integrato EASA 2026. Flotta addestrativa avanzata e addestramento su simulatore Alsim ALX.",
        cta: "Diventa Pilota",
        link: "https://www.easa.europa.eu",
        badge: "ACADEMY CO-SPONSOR",
        badgeColor: "border-amber-500/30 text-amber-400 bg-amber-950/20",
        glowColor: "shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500/30"
      });
    }

    return [
      ...ads,
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
        title: "Modellismo Storico Boeing 747-400",
        desc: "Replica da collezione in scala 1:200 pressofusa in metallo. Pezzo d'epoca numerato per collezionisti.",
        cta: "Verifica Disponibilità",
        link: "https://www.amazon.it",
        badge: "COLLECTIBLE DEALS",
        badgeColor: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
        glowColor: "shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-500/30"
      }
    ];
  }, [modelName, lang]);

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
  }, []);

  // Ruota gli annunci ogni 12 secondi
  useEffect(() => {
    if (ADS.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIdx(prev => (prev + 1) % ADS.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [ADS.length]);

  if (loading || isPro) {
    return null; // I PRO non vedono nessun banner!
  }

  const activeAd = ADS[currentAdIdx] || ADS[0];
  if (!activeAd) return null;

  return (
    <div className={`w-full mt-12 bg-slate-900/10 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all duration-500 font-mono text-sm ${activeAd.glowColor}`}>
      {/* Laser light scan decoration */}
      <div className="absolute top-0 left-0 w-[150px] h-full bg-gradient-to-r from-transparent via-cyan-500/3 to-transparent -skew-x-12 translate-x-[-150px] animate-[pulse_6s_infinite]"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black px-2 py-0.5 border rounded uppercase tracking-wider ${activeAd.badgeColor}`}>
              {activeAd.badge}
            </span>
            <span className="text-sm text-slate-600 uppercase tracking-widest">
              ANNUNCIO RADAR SPONSORIZZATO
            </span>
          </div>
          <h4 className="text-white font-black uppercase text-base tracking-wider">
            {activeAd.title}
          </h4>
          <p className="text-sm text-slate-450 font-sans leading-relaxed">
            {activeAd.desc}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {activeAd.link.startsWith("http") ? (
            <a
              href={activeAd.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white px-5 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all font-bold uppercase tracking-wider text-sm"
            >
              {activeAd.cta}
            </a>
          ) : (
            <Link
              href={activeAd.link}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              {activeAd.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
