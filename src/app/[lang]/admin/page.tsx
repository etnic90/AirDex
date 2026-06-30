"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalModels: 0,
    modelsComplete: 0,
    modelsNoDesc: 0,
    modelsNoImage: 0,
    modelsNeedsReview: 0,
    
    totalAirports: 0,
    airportsComplete: 0,
    airportsNoDesc: 0,
    airportsNoImage: 0,
    airportsNeedsReview: 0,
    
    totalAirlines: 0,
    airlinesNeedsReview: 0,
    pendingSpotters: 0,
  });
  const [langCode, setLangCode] = useState("en");

  // Get current language slug from router if needed (fallback to param parsing in Client Component)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/");
      if (pathParts[1] && pathParts[1].length === 2) {
        setLangCode(pathParts[1]);
      }
    }
  }, []);
  const [loading, setLoading] = useState(true);

  // STATI PER LA SINCRONIZZAZIONE LOGHI
  const [syncStatus, setSyncStatus] = useState<"idle" | "fetching" | "syncing" | "done" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [
        totalModelsRes,
        modelsNoDescRes,
        modelsNoImageRes,
        modelsCompleteRes,
        modelsNeedsReviewRes,
        
        totalAirportsRes,
        airportsNoDescRes,
        airportsNoImageRes,
        airportsCompleteRes,
        airportsNeedsReviewRes,

        airlinesRes,
        airlinesNeedsReviewRes,
        spottersRes,
      ] = await Promise.all([
        supabase.from("aircraft_models").select("id", { count: "exact", head: true }),
        supabase.from("aircraft_models").select("id", { count: "exact", head: true }).or("description.is.null,description.eq."),
        supabase.from("aircraft_models").select("id", { count: "exact", head: true }).or("house_livery_url.is.null,house_livery_url.eq."),
        supabase.from("aircraft_models").select("id", { count: "exact", head: true })
          .not("description", "is", null).not("description", "eq", "")
          .not("house_livery_url", "is", null).not("house_livery_url", "eq", ""),
        supabase.from("aircraft_models").select("id", { count: "exact", head: true }).eq("image_needs_review", true),

        supabase.from("airports").select("id", { count: "exact", head: true }),
        supabase.from("airports").select("id", { count: "exact", head: true }).or("history.is.null,history.eq."),
        supabase.from("airports").select("id", { count: "exact", head: true }).or("image_url.is.null,image_url.eq.,image_url.eq.NOT_FOUND"),
        supabase.from("airports").select("id", { count: "exact", head: true })
          .not("history", "is", null).not("history", "eq", "")
          .not("image_url", "is", null).not("image_url", "eq", "").not("image_url", "eq", "NOT_FOUND"),
        supabase.from("airports").select("id", { count: "exact", head: true }).eq("image_needs_review", true),

        supabase.from("airlines").select("id", { count: "exact", head: true }),
        supabase.from("airlines").select("id", { count: "exact", head: true }).eq("image_needs_review", true),
        supabase.from("spotter_uploads").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      ]);

      setStats({
        totalModels: totalModelsRes.count || 0,
        modelsComplete: modelsCompleteRes.count || 0,
        modelsNoDesc: modelsNoDescRes.count || 0,
        modelsNoImage: modelsNoImageRes.count || 0,
        modelsNeedsReview: modelsNeedsReviewRes.count || 0,
        
        totalAirports: totalAirportsRes.count || 0,
        airportsComplete: airportsCompleteRes.count || 0,
        airportsNoDesc: airportsNoDescRes.count || 0,
        airportsNoImage: airportsNoImageRes.count || 0,
        airportsNeedsReview: airportsNeedsReviewRes.count || 0,
        
        totalAirlines: airlinesRes.count || 0,
        airlinesNeedsReview: airlinesNeedsReviewRes.count || 0,
        pendingSpotters: spottersRes.count || 0,
      });
    } catch (err) {
      console.error("Errore caricamento statistiche dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Utility per scaricare immagini superando i blocchi CORS tramite un proxy pubblico o direttamente se possibile
  const downloadImageBlob = async (
    url: string, 
    logCallback: (msg: string) => void
  ): Promise<{ blob: Blob; contentType: string; ext: string } | null> => {
    const attempts = [
      { name: "Direct Link", url: url, isProxy: false },
      { name: "Weserv.nl Image CDN", url: `https://images.weserv.nl/?url=${encodeURIComponent(url)}`, isProxy: true },
      { name: "AllOrigins Proxy", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, isProxy: true },
      { name: "CorsProxy.io", url: `https://corsproxy.io/?${encodeURIComponent(url)}`, isProxy: true }
    ];

    for (const attempt of attempts) {
      const isWiki = url.includes("wikimedia.org") || url.includes("wikipedia.org");
      if (!attempt.isProxy && !isWiki) {
        continue;
      }

      try {
        logCallback(`  ├─ 🛰️ Tentativo tramite: ${attempt.name}...`);
        const res = await fetch(attempt.url);
        if (res.ok) {
          const blob = await res.blob();
          const contentType = res.headers.get("content-type") || blob.type || "image/png";
          let ext = "png";
          if (contentType.includes("svg")) ext = "svg";
          else if (contentType.includes("webp")) ext = "webp";
          else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
          logCallback(`  ├─ 📥 Download completato (${attempt.name}) - Tipo: ${contentType}`);
          return { blob, contentType, ext };
        } else {
          logCallback(`  ├─ ⚠️ Fallito ${attempt.name} - Status: ${res.status}`);
        }
      } catch (e: unknown) {
        logCallback(`  ├─ ⚠️ Errore rete ${attempt.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return null;
  };

  // Funzione principale di sincronizzazione (eseguita nel browser del client)
  const handleSyncLogos = async () => {
    if (!confirm("Avviare la localizzazione dei loghi? Lo script scaricherà i loghi tramite il browser e li caricherà su Supabase Storage.")) return;

    setSyncStatus("fetching");
    setSyncLogs(["🔍 Analisi dei record nel database..."]);

    try {
      let airlines: Array<{ id: string; name: string; website: string | null; logo_url: string | null }> = [];
      let start = 0;
      const size = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("airlines")
          .select("id, name, website, logo_url")
          .range(start, start + size - 1);

        if (error) throw error;

        if (data) {
          airlines = [...airlines, ...data];
          if (data.length < size) {
            hasMore = false;
          } else {
            start += size;
          }
        } else {
          hasMore = false;
        }
      }

      const targets = (airlines || []).filter((a) => {
        const logo = a.logo_url;
        return !logo || !logo.includes("supabase.co");
      });

      if (targets.length === 0) {
        setSyncStatus("done");
        setSyncLogs((prev) => [...prev, "✅ Tutti i loghi delle compagnie sono già localizzati su Supabase!"]);
        return;
      }

      setSyncStatus("syncing");
      setSyncProgress({ current: 0, total: targets.length, currentName: "" });
      setSyncLogs((prev) => [...prev, `📊 Trovati ${targets.length} loghi da sincronizzare in locale.`]);

      let successes = 0;

      for (let i = 0; i < targets.length; i++) {
        const airline = targets[i];
        setSyncProgress((prev) => ({ ...prev, current: i + 1, currentName: airline.name }));

        let targetUrl = null;
        if (airline.logo_url && airline.logo_url.trim() !== "") {
          targetUrl = airline.logo_url;
        } else if (airline.website) {
          const domain = airline.website
            .replace(/https?:\/\//, '')
            .replace(/www\./, '')
            .split('/')[0];
          targetUrl = `https://logo.clearbit.com/${domain}`;
        }

        if (!targetUrl) {
          setSyncLogs((prev) => [...prev, `⚠️ ${airline.name}: Nessun URL o sito web disponibile.`]);
          continue;
        }

        const imageResult = await downloadImageBlob(targetUrl, (msg) => {
          setSyncLogs((prev) => [...prev, msg]);
        });
        if (!imageResult) {
          setSyncLogs((prev) => [...prev, `❌ ${airline.name}: Impossibile caricare l'immagine (Errore CORS o rete).`]);
          continue;
        }

        const { blob, contentType, ext } = imageResult;
        const storagePath = `airlines/${airline.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("aircraft_images")
          .upload(storagePath, blob, {
            upsert: true,
            contentType: contentType,
          });

        if (uploadError) {
          setSyncLogs((prev) => [...prev, `❌ ${airline.name}: Errore upload Storage: ${uploadError.message}`]);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("aircraft_images")
          .getPublicUrl(storagePath);

        const { error: dbError } = await supabase
          .from("airlines")
          .update({ logo_url: publicUrl })
          .eq("id", airline.id);

        if (dbError) {
          setSyncLogs((prev) => [...prev, `❌ ${airline.name}: Errore aggiornamento DB: ${dbError.message}`]);
          continue;
        }

        successes++;
        setSyncLogs((prev) => [...prev, `✅ ${airline.name}: Logo localizzato (${ext.toUpperCase()}).`]);
      }

      setSyncStatus("done");
      setSyncLogs((prev) => [...prev, `🏁 Sincronizzazione completata! Loghi salvati su Supabase Storage: ${successes}/${targets.length}`]);
      fetchStats();

    } catch (err: unknown) {
      console.error(err);
      setSyncStatus("error");
      setSyncLogs((prev) => [...prev, `❌ Errore fatale durante la sincronizzazione: ${err instanceof Error ? err.message : String(err)}`]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-amber-500">
        <div className="w-12 h-12 border-4 border-amber-950 border-t-amber-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        <p className="font-mono text-sm tracking-[0.2em] animate-pulse uppercase">Inizializzazione Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intestazione principale */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-1 font-mono">Pannello di Controllo Core</h1>
          <p className="text-slate-450 font-mono text-xs uppercase">Gestione e monitoraggio dei Custom Post Types e dello stato del database</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right font-mono text-xs hidden sm:block">
          <span className="text-slate-500 uppercase block font-bold">Stato Sistema</span>
          <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1.5 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Operativo
          </span>
        </div>
      </div>

      {/* Warning Banner per Revisioni Pendenti */}
      {stats.modelsNeedsReview + stats.airportsNeedsReview + stats.airlinesNeedsReview > 0 && (
        <div className="bg-red-950/15 border border-red-900/40 text-red-200 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 font-mono text-xs shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-red-500 text-xl leading-none animate-bounce">🚩</span>
            <div>
              <p className="font-black text-sm uppercase tracking-wider text-red-400 leading-none mb-1">Revisione Immagini Richiesta</p>
              <p className="text-slate-400">Rilevati <strong className="text-red-400">{stats.modelsNeedsReview + stats.airportsNeedsReview + stats.airlinesNeedsReview}</strong> asset con anomalie (Aerei: {stats.modelsNeedsReview}, Compagnie: {stats.airlinesNeedsReview}, Aeroporti: {stats.airportsNeedsReview}).</p>
            </div>
          </div>
          <Link
            href={`/${langCode}/admin/image-reviews`}
            className="w-full lg:w-auto text-center px-5 py-2.5 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white rounded-xl font-mono text-xs uppercase tracking-widest font-black transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer shrink-0"
          >
            Risolvi Segnalazioni
          </Link>
        </div>
      )}

      {/* PANNELLO DI COMANDO: SCELTA RAPIDA STRUMENTI (NUOVO INTERFACCIA SEMPLIFICATA) */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
        <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          Centro Operativo Navigazione Rapida
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Aerei */}
          <Link 
            href={`/${langCode}/admin/aircrafts`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">✈️</span>
                <span className="text-[10px] font-mono font-black bg-cyan-950 text-cyan-400 border border-cyan-900/40 px-2 py-0.5 rounded uppercase tracking-wider">{stats.totalModels} modelli</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-cyan-400 transition-colors">Modelli Aerei</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Gestisci l&apos;enciclopedia della flotta civile: inserimento, specifiche tecniche e tracciatura.</p>
            </div>
            <div className="text-[10px] font-mono font-black text-cyan-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Registro &rarr;</div>
          </Link>

          {/* Compagnie */}
          <Link 
            href={`/${langCode}/admin/airlines`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">🏢</span>
                <span className="text-[10px] font-mono font-black bg-purple-950 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded uppercase tracking-wider">{stats.totalAirlines} vettori</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-purple-400 transition-colors">Registro Compagnie</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Amministra gli operatori di linea: loghi vettori, hub commerciali ed alleanze globali.</p>
            </div>
            <div className="text-[10px] font-mono font-black text-purple-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Registro &rarr;</div>
          </Link>

          {/* Aeroporti */}
          <Link 
            href={`/${langCode}/admin/airports`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">🌍</span>
                <span className="text-[10px] font-mono font-black bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded uppercase tracking-wider">{stats.totalAirports} nodi</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-emerald-400 transition-colors">Terminale Aeroporti</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Monitora coordinate geografiche, altitudini e runways del network di scali.</p>
            </div>
            <div className="text-[10px] font-mono font-black text-emerald-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Registro &rarr;</div>
          </Link>

          {/* Quick Editor */}
          <Link 
            href={`/${langCode}/admin/editor`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-yellow-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">⚡</span>
                <span className="text-[10px] font-mono font-black bg-yellow-950 text-yellow-400 border border-yellow-900/40 px-2 py-0.5 rounded uppercase tracking-wider">Fast Update</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-yellow-400 transition-colors">Quick Editor</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Editor tabellare rapido per modificare i dati in blocco senza aprire le singole schede.</p>
            </div>
            <div className="text-[10px] font-mono font-black text-yellow-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Editor &rarr;</div>
          </Link>

          {/* Moderazione Spotters */}
          <Link 
            href={`/${langCode}/admin/spotters`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">📸</span>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider ${stats.pendingSpotters > 0 ? "bg-amber-950 text-amber-400 border border-amber-800/40 animate-pulse" : "bg-slate-950 text-slate-500 border border-slate-850"}`}>{stats.pendingSpotters} pendenti</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-amber-400 transition-colors">Moderazione Foto</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Approva o respingi le segnalazioni e i caricamenti dei cacciatori di aerei (Spotters).</p>
            </div>
            <div className="text-[10px] font-mono font-black text-amber-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Coda &rarr;</div>
          </Link>

          {/* Redazione Blog */}
          <Link 
            href={`/${langCode}/admin/blog`}
            className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-6 rounded-2xl transition-all group flex flex-col justify-between h-44 shadow-lg cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl group-hover:scale-110 transition-transform block">📰</span>
                <span className="text-[10px] font-mono font-black bg-pink-950 text-pink-400 border border-pink-900/40 px-2 py-0.5 rounded uppercase tracking-wider">Newsroom</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1.5 group-hover:text-pink-400 transition-colors">Redazione Blog</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">Gestione e scrittura degli articoli editoriali, curiosità aeronautiche e aggiornamenti.</p>
            </div>
            <div className="text-[10px] font-mono font-black text-pink-400 group-hover:translate-x-1 transition-transform uppercase tracking-wider self-end mt-2">Apri Redazione &rarr;</div>
          </Link>
        </div>
      </div>

      {/* Database Quality & Metrics Section */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
        <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Stato di Completamento Database (Qualità Dati)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aircraft Models Quality Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">✈️ Catalogo Aerei</h4>
              <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2.5 py-1 rounded font-mono font-bold">
                {Math.round((stats.modelsComplete / (stats.totalModels || 1)) * 100)}% OK
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                  style={{ width: `${(stats.modelsComplete / (stats.totalModels || 1)) * 100}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs font-mono text-slate-400 pt-2 border-t border-slate-950/40 mt-2">
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Totale Modelli:</span>
                  <span className="text-white font-bold">{stats.totalModels}</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Record Completi:</span>
                  <span className="text-emerald-400 font-bold">{stats.modelsComplete}</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Senza Storia:</span>
                  <span className={stats.modelsNoDesc > 0 ? "text-amber-500 font-bold" : "text-slate-500"}>
                    {stats.modelsNoDesc}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Senza Foto:</span>
                  <span className={stats.modelsNoImage > 0 ? "text-red-500 font-bold" : "text-slate-500"}>
                    {stats.modelsNoImage}
                  </span>
                </div>
                <div className="flex justify-between col-span-2 text-slate-400 font-black">
                  <span>⚠️ Da Revisionare (Suspicious):</span>
                  <span className={stats.modelsNeedsReview > 0 ? "text-red-500 font-black text-sm" : "text-slate-500"}>
                    {stats.modelsNeedsReview}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Airports Quality Card */}
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">🌍 Registro Aeroporti</h4>
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2.5 py-1 rounded font-mono font-bold">
                {Math.round((stats.airportsComplete / (stats.totalAirports || 1)) * 100)}% OK
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                  style={{ width: `${(stats.airportsComplete / (stats.totalAirports || 1)) * 100}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs font-mono text-slate-400 pt-2 border-t border-slate-950/40 mt-2">
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Totale Scali:</span>
                  <span className="text-white font-bold">{stats.totalAirports}</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Record Completi:</span>
                  <span className="text-emerald-400 font-bold">{stats.airportsComplete}</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Senza Storia:</span>
                  <span className={stats.airportsNoDesc > 0 ? "text-amber-500 font-bold" : "text-slate-500"}>
                    {stats.airportsNoDesc}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Senza Foto:</span>
                  <span className={stats.airportsNoImage > 0 ? "text-red-500 font-bold" : "text-slate-500"}>
                    {stats.airportsNoImage}
                  </span>
                </div>
                <div className="flex justify-between col-span-2 text-slate-400 font-black">
                  <span>⚠️ Da Revisionare (Suspicious):</span>
                  <span className={stats.airportsNeedsReview > 0 ? "text-red-500 font-black text-sm" : "text-slate-500"}>
                    {stats.airportsNeedsReview}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pannello Manutenzione ed Ecosistema */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
        <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping animate-duration-1000" />
          Modulo Manutenzione Loghi
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
          Il terminale locale è schermato da limitazioni di rete (Sandbox). Questo modulo permette di scaricare i loghi delle compagnie aeree in locale scaricandoli in tempo reale tramite la tua connessione ed eseguendo l&apos;upload nel tuo bucket Supabase Storage convertendoli automaticamente in formato **WebP**.
        </p>

        {syncStatus === "idle" && (
          <button
            onClick={handleSyncLogos}
            className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs uppercase tracking-widest font-black shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
          >
            Sincronizza Loghi Compagnie
          </button>
        )}

        {/* Barra di avanzamento */}
        {(syncStatus === "fetching" || syncStatus === "syncing") && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="animate-pulse">Elaborazione: {syncProgress.currentName || "Analisi..."}</span>
              <span>{syncProgress.current} / {syncProgress.total}</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {syncStatus === "done" && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/20 border border-emerald-800 text-emerald-400 text-xs font-mono rounded">
              ✅ Processo completato correttamente! Tutti i loghi sono ospitati su Supabase Storage.
            </div>
            <button
              onClick={() => setSyncStatus("idle")}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Ricomincia
            </button>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="space-y-4">
            <div className="p-3 bg-red-950/20 border border-red-800 text-red-400 text-xs font-mono rounded">
              ❌ Sincronizzazione interrotta a causa di un errore. Controlla la console.
            </div>
            <button
              onClick={() => setSyncStatus("idle")}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Riprova
            </button>
          </div>
        )}

        {/* Area di Log in tempo reale */}
        {syncLogs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Terminale Log Sincronizzazione:</h4>
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-xs text-cyan-400/90 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {syncLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}