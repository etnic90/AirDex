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
  status: 'SPOTTED' | 'FLOWN';
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

  const toggleCapture = async (status: 'SPOTTED' | 'FLOWN') => {
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
      <div className="flex gap-2 font-mono text-[10px] text-slate-500 items-center">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
        Sincronizzazione Radar...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2 items-start bg-slate-900/40 border border-slate-800 p-4 rounded-xl max-w-sm">
        <p className="text-xs text-slate-400 font-mono leading-relaxed">
          Vuoi aggiungere questo aereo al tuo AirDex personale?
        </p>
        <Link
          href={`/${lang}/login`}
          className="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-lg transition-all"
        >
          Accedi per Catturare 🔒
        </Link>
      </div>
    );
  }

  const isSpotted = captures.some(c => c.status === "SPOTTED");
  const isFlown = captures.some(c => c.status === "FLOWN");

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-900/80 rounded-2xl backdrop-blur-sm shadow-md">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
        Stato Acquisizione Licenza Pilota
      </span>
      <div className="flex gap-3">
        {/* Spotted Button */}
        <button
          onClick={() => toggleCapture("SPOTTED")}
          disabled={actionLoading !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono tracking-wider transition-all duration-300 uppercase font-bold ${
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
          <span>{isSpotted ? "Spotted" : "Segna Spotted"}</span>
        </button>

        {/* Flown Button */}
        <button
          onClick={() => toggleCapture("FLOWN")}
          disabled={actionLoading !== null}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono tracking-wider transition-all duration-300 uppercase font-bold ${
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
          <span>{isFlown ? "Flown" : "Segna Flown"}</span>
        </button>
      </div>
    </div>
  );
}
