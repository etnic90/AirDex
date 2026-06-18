"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalModels: 0,
    totalAirlines: 0,
    pendingSpotters: 0,
  });
  const [loading, setLoading] = useState(true);

  // STATI PER LA SINCRONIZZAZIONE LOGHI
  const [syncStatus, setSyncStatus] = useState<"idle" | "fetching" | "syncing" | "done" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [modelsRes, airlinesRes, spottersRes] = await Promise.all([
        supabase.from("aircraft_models").select("id", { count: "exact", head: true }),
        supabase.from("airlines").select("id", { count: "exact", head: true }),
        supabase.from("spotter_uploads").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      ]);

      setStats({
        totalModels: modelsRes.count || 0,
        totalAirlines: airlinesRes.count || 0,
        pendingSpotters: spottersRes.count || 0,
      });
    } catch (err) {
      console.error("Errore caricamento statistiche dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [supabase]);

  // Utility per scaricare immagini superando i blocchi CORS tramite un proxy pubblico o direttamente se possibile
  const downloadImageBlob = async (
    url: string, 
    logCallback: (msg: string) => void
  ): Promise<{ blob: Blob; contentType: string; ext: string } | null> => {
    // Catena di fallbacks per i Proxy CORS
    const attempts = [
      // 1. Download Diretto (per wiki/wikimedia che supportano CORS nativamente)
      { name: "Direct Link", url: url, isProxy: false },
      // 2. Weserv.nl Image CDN (stabile, specifico per immagini, ignora i blocchi adblocker)
      { name: "Weserv.nl Image CDN", url: `https://images.weserv.nl/?url=${encodeURIComponent(url)}`, isProxy: true },
      // 3. AllOrigins Proxy (stabile e robusto con query param)
      { name: "AllOrigins Proxy", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, isProxy: true },
      // 4. CorsProxy.io
      { name: "CorsProxy.io", url: `https://corsproxy.io/?${encodeURIComponent(url)}`, isProxy: true }
    ];

    for (const attempt of attempts) {
      // Se non è wikipedia e proviamo il caricamento diretto, saltiamo per evitare CORS errors inutili in console
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
      } catch (e: any) {
        logCallback(`  ├─ ⚠️ Errore rete ${attempt.name}: ${e.message}`);
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
      // 1. Legge tutte le compagnie (con paginazione)
      let airlines: any[] = [];
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

      // 2. Filtra quelle con logo esterno o mancante
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
          let domain = airline.website
            .replace(/https?:\/\//, '')
            .replace(/www\./, '')
            .split('/')[0];
          targetUrl = `https://logo.clearbit.com/${domain}`;
        }

        if (!targetUrl) {
          setSyncLogs((prev) => [...prev, `⚠️ ${airline.name}: Nessun URL o sito web disponibile.`]);
          continue;
        }

        // Download tramite proxy o diretto
        const imageResult = await downloadImageBlob(targetUrl, (msg) => {
          setSyncLogs((prev) => [...prev, msg]);
        });
        if (!imageResult) {
          setSyncLogs((prev) => [...prev, `❌ ${airline.name}: Impossibile caricare l'immagine (Errore CORS o rete).`]);
          continue;
        }

        const { blob, contentType, ext } = imageResult;
        const storagePath = `airlines/${airline.id}.${ext}`;

        // Upload su Supabase Storage (tramite client loggato con RLS bypassato)
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

        // Ottiene URL pubblico
        const { data: { publicUrl } } = supabase.storage
          .from("aircraft_images")
          .getPublicUrl(storagePath);

        // Aggiorna database
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
      fetchStats(); // Ricarica le statistiche

    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncLogs((prev) => [...prev, `❌ Errore fatale durante la sincronizzazione: ${err.message}`]);
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
      {/* Intestazione */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">Console di Comando</h1>
        <p className="text-slate-400 font-mono text-xs uppercase">Stato operativo del database cluster e manutenzione</p>
      </div>

      {/* Grid delle Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors" />
          <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider">Modelli Aerei</h3>
          <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.totalModels}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-purple-500 transition-colors" />
          <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider">Compagnie Aeree</h3>
          <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.totalAirlines}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-amber-500 transition-colors" />
          <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider">Spotters In Attesa</h3>
          <p className="text-4xl font-bold text-white mt-2 font-mono">{stats.pendingSpotters}</p>
        </div>
      </div>

      {/* Pannello Manutenzione ed Ecosistema */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-45" />
        
        <h3 className="text-md font-black text-white uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
          Modulo Manutenzione Loghi
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Il terminale locale è schermato da limitazioni di rete (Sandbox). Questo modulo permette di caricare i loghi delle compagnie aeree in locale scaricandoli in tempo reale tramite la tua connessione ed eseguendo l'upload nel tuo bucket Supabase Storage convertendoli automaticamente in formato **WebP**.
        </p>

        {syncStatus === "idle" && (
          <button
            onClick={handleSyncLogos}
            className="px-6 py-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-colors cursor-pointer"
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
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Riprova
            </button>
          </div>
        )}

        {/* Area di Log in tempo reale */}
        {syncLogs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Terminale Log Sincronizzazione:</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-cyan-400/90 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
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