"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

interface CaptureButtonsProps {
  targetId: string;
  type: 'AIRCRAFT' | 'AIRLINE';
  lang?: string;
}

interface UserCapture {
  id: string;
  type: 'AIRCRAFT' | 'AIRLINE';
  target_id: string;
  status: 'SPOTTED' | 'FLOWN' | 'FAVORITE';
}

export default function CaptureButtons({ targetId, type, lang = "en" }: CaptureButtonsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [captures, setCaptures] = useState<UserCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndCaptures = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // Fetch captures for this target
      const { data } = await supabase
        .from("user_captures")
        .select("id, type, target_id, status")
        .eq("user_id", session.user.id)
        .eq("target_id", targetId)
        .eq("type", type);

      setCaptures(data || []);
      setLoading(false);
    };

    checkUserAndCaptures();
  }, [targetId, type]);

  const toggleCapture = async (status: 'SPOTTED' | 'FLOWN' | 'FAVORITE') => {
    if (!user) return;
    setActionLoading(status);

    const existing = captures.find(c => c.status === status);

    if (existing) {
      const { error } = await supabase
        .from("user_captures")
        .delete()
        .eq("id", existing.id);
      
      if (!error) {
        setCaptures(prev => prev.filter(c => c.id !== existing.id));
      }
    } else {
      const newCapture = {
        user_id: user.id,
        type,
        target_id: targetId,
        status
      };

      const { data, error } = await supabase
        .from("user_captures")
        .insert(newCapture)
        .select()
        .single();
      
      if (!error && data) {
        setCaptures(prev => [...prev, data]);
      }
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex gap-2 font-mono text-sm text-slate-500 items-center">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
        Sincronizzazione Radar...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2 items-start bg-slate-900/40 border border-slate-800 p-4 rounded-xl max-w-sm">
        <p className="text-sm text-slate-400 font-mono leading-relaxed">
          Vuoi aggiungere questo aereo al tuo AirDex personale?
        </p>
        <Link
          href={`/${lang}/login`}
          className="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 font-mono text-sm tracking-wider uppercase px-4 py-2 rounded-lg transition-all cursor-pointer"
        >
          Accedi per Catturare 🔒
        </Link>
      </div>
    );
  }

  const isSpotted = captures.some(c => c.status === "SPOTTED");
  const isFlown = captures.some(c => c.status === "FLOWN");
  const isFavorite = captures.some(c => c.status === "FAVORITE");

  const getButtonLabels = () => {
    switch (lang) {
      case "it":
        return {
          spotted: "Spotted",
          flown: "Flown",
          favorite: "Favorite",
          help: "Traccia il tuo hangar personale: segna questo aereo come Spotted, Flown o aggiungilo ai preferiti (Favorite). Potrai visualizzare e gestire la tua collezione aeronautica personalizzata direttamente nella dashboard del tuo profilo pilota."
        };
      case "es":
        return {
          spotted: "Spotted",
          flown: "Flown",
          favorite: "Favorite",
          help: "Registra tu hangar personal: marca este avión como Spotted, Flown o agrégalo a tus favoritos (Favorite). Podrás ver y gestionar tu colección directamente en la sección de perfil de piloto."
        };
      case "fr":
        return {
          spotted: "Spotted",
          flown: "Flown",
          favorite: "Favorite",
          help: "Suivez votre hangar personnel : marquez cet appareil comme Spotted, Flown ou ajoutez-le à vos favoris (Favorite). Vous pourrez consulter votre collection directement dans votre profil de pilote."
        };
      default:
        return {
          spotted: "Spotted",
          flown: "Flown",
          favorite: "Favorite",
          help: "Track your personal hangar: mark this aircraft as Spotted, Flown, or add it to your Favorite. You can view and manage your custom aviation collection directly in your pilot profile dashboard."
        };
    }
  };

  const labels = getButtonLabels();

  return (
    <div className="flex flex-col gap-3.5 p-5 bg-slate-900/30 border border-slate-900/80 rounded-2xl backdrop-blur-sm shadow-md text-left">
      <span className="text-sm font-mono text-slate-400 uppercase tracking-widest block font-bold">
        Stato Acquisizione Licenza Pilota
      </span>
      <div className="flex flex-wrap gap-3">
        {/* Spotted Button */}
        <button
          onClick={() => toggleCapture("SPOTTED")}
          disabled={actionLoading !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider transition-all duration-300 uppercase font-bold cursor-pointer disabled:cursor-not-allowed ${
            isSpotted 
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]" 
              : "bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
          } disabled:opacity-50`}
        >
          {actionLoading === "SPOTTED" ? (
            <span className="w-3.5 h-3.5 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></span>
          ) : (
            "👁️"
          )}
          <span>{labels.spotted}</span>
        </button>

        {/* Flown Button */}
        <button
          onClick={() => toggleCapture("FLOWN")}
          disabled={actionLoading !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider transition-all duration-300 uppercase font-bold cursor-pointer disabled:cursor-not-allowed ${
            isFlown 
              ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]" 
              : "bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
          } disabled:opacity-50`}
        >
          {actionLoading === "FLOWN" ? (
            <span className="w-3.5 h-3.5 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></span>
          ) : (
            "✈️"
          )}
          <span>{labels.flown}</span>
        </button>

        {/* Favorite Button */}
        <button
          onClick={() => toggleCapture("FAVORITE")}
          disabled={actionLoading !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider transition-all duration-300 uppercase font-bold cursor-pointer disabled:cursor-not-allowed ${
            isFavorite 
              ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]" 
              : "bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
          } disabled:opacity-50`}
        >
          {actionLoading === "FAVORITE" ? (
            <span className="w-3.5 h-3.5 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></span>
          ) : (
            "⭐"
          )}
          <span>{labels.favorite}</span>
        </button>
      </div>
      
      {/* Help text */}
      <p className="text-slate-400 text-sm font-sans leading-relaxed border-t border-slate-900/60 pt-3 mt-1">
        {labels.help}
      </p>
    </div>
  );
}
