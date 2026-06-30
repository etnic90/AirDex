"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface SpotterUpload {
  id: string;
  photographer_name: string;
  image_url: string;
  registration_number?: string;
  notes?: string;
  created_at: string;
  status: string;
  aircraft_models?: {
    model_name: string;
    manufacturers?: { name: string };
  };
  airlines?: { name: string } | null;
  airports?: { name: string; iata_code: string } | null;
}

export default function AdminSpottersPage() {
  const [submissions, setSubmissions] = useState<SpotterUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchPendingSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("spotter_uploads")
      .select(`
        id,
        photographer_name,
        image_url,
        registration_number,
        notes,
        created_at,
        status,
        aircraft_models (
          model_name,
          manufacturers ( name )
        ),
        airlines ( name ),
        airports ( name, iata_code )
      `)
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Errore recupero submissions:", error);
    } else {
      setSubmissions(data as unknown as SpotterUpload[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingSubmissions();
  }, [fetchPendingSubmissions]);

  // Gestione Approvazione
  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const { error } = await supabase
        .from("spotter_uploads")
        .update({ status: "APPROVED" })
        .eq("id", id);

      if (error) throw error;

      // Aggiorna elenco locale
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      console.error(err);
      alert("Errore durante l'approvazione del record.");
    } finally {
      setActioningId(null);
    }
  };

  // Gestione Rifiuto e Pulizia Storage
  const handleReject = async (id: string, imageUrl: string) => {
    if (!confirm("Sei sicuro di voler rifiutare ed eliminare questo scatto?")) return;

    setActioningId(id);
    try {
      // 1. Aggiorna stato nel DB
      const { error: dbError } = await supabase
        .from("spotter_uploads")
        .update({ status: "REJECTED" })
        .eq("id", id);

      if (dbError) throw dbError;

      // 2. Prova a eliminare dallo Storage per liberare spazio
      try {
        // Estrae il percorso dal public URL (es: 'uploads/file.jpg')
        // L'URL pubblico ha una struttura tipo: .../storage/v1/object/public/spotters/uploads/file.jpg
        const urlParts = imageUrl.split("/spotters/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from("spotters")
            .remove([filePath]);
          
          if (storageError) {
            console.warn("Avviso pulizia Storage:", storageError.message);
          } else {
            console.log("File rimosso correttamente dallo Storage.");
          }
        }
      } catch (storageErr) {
        console.warn("Impossibile pulire il file dallo Storage:", storageErr);
      }

      // Aggiorna elenco locale
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione del record.");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-amber-500">
        <div className="w-12 h-12 border-4 border-amber-950 border-t-amber-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        <p className="font-mono text-sm tracking-[0.2em] animate-pulse uppercase">Scansione Segnali In Attesa...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-900 via-amber-500 to-amber-900 opacity-50"></div>
      
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">Moderazione Spotter</h2>
          <p className="text-slate-400 text-xs font-mono">Controllo e validazione scatti community</p>
        </div>
        <span className="bg-amber-950 text-amber-400 border border-amber-800 px-4 py-2 rounded text-xs font-mono shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          In Attesa: <strong className="text-white ml-1">{submissions.length}</strong>
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="p-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mx-auto mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Sistemi in Ordine</h3>
          <p className="text-slate-500 font-mono text-xs">Nessun avvistamento spotter in attesa di convalida.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {submissions.map((sub) => {
            const aircraftName = sub.aircraft_models?.model_name || "Velivolo Sconosciuto";
            const manufacturerName = sub.aircraft_models?.manufacturers?.name || "";

            return (
              <div key={sub.id} className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-slate-800/30 transition-colors group">
                {/* Visualizzazione Foto */}
                <div className="w-full lg:w-64 h-36 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sub.image_url}
                    alt="Submission Preview"
                    className="w-full h-full object-cover"
                  />
                  {sub.registration_number && (
                    <span className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold">
                      {sub.registration_number}
                    </span>
                  )}
                </div>

                {/* Dettagli della Sottomissione */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <span className="text-amber-500 font-mono text-[10px] uppercase tracking-wider block font-bold">
                          Avvistamento Ottico
                        </span>
                        <h3 className="text-white text-lg font-bold">
                          {manufacturerName} {aircraftName}
                        </h3>
                      </div>
                      <span className="text-slate-500 font-mono text-xs">
                        {new Date(sub.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs font-mono text-slate-400">
                      <div>
                        📷 Autore: <span className="text-slate-200 font-sans font-bold">{sub.photographer_name}</span>
                      </div>
                      {sub.airlines?.name && (
                        <div>
                          ✈️ Vettore: <span className="text-slate-200 font-sans">{sub.airlines.name}</span>
                        </div>
                      )}
                      {sub.airports?.name && (
                        <div className="sm:col-span-2">
                          📍 Luogo: <span className="text-slate-200 font-sans">{sub.airports.name}</span>{" "}
                          <span className="text-cyan-500">({sub.airports.iata_code})</span>
                        </div>
                      )}
                    </div>
                    {sub.notes && (
                      <div className="mt-4 bg-slate-950/40 p-3 rounded border border-slate-800 text-slate-400 text-xs italic font-sans">
                        &quot;{sub.notes}&quot;
                      </div>
                    )}
                  </div>

                  {/* Pulsanti Moderazione */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800/40 lg:justify-end">
                    <button
                      onClick={() => handleReject(sub.id, sub.image_url)}
                      disabled={actioningId !== null}
                      className="px-4 py-2 rounded bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/50 text-xs font-bold font-mono uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Rifiuta & Rimuovi
                    </button>
                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={actioningId !== null}
                      className="px-4 py-2 rounded bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 text-xs font-bold font-mono uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    >
                      Convalida Scatto
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
