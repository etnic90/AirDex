"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

interface AircraftModel {
  id: string;
  model_name: string;
  house_livery_url: string | null;
  launch_customer_livery_url: string | null;
  image_needs_review: boolean;
  manufacturers?: {
    name: string;
  } | null;
}

interface Airline {
  id: string;
  name: string;
  iata_code: string | null;
  icao_code: string | null;
  country: string;
  logo_url: string | null;
  image_needs_review: boolean;
}

interface Airport {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  image_url: string | null;
  image_needs_review: boolean;
}

type TabType = "aircrafts" | "airlines" | "airports";

export default function ImageReviewsPage() {
  const params = useParams();
  const lang = params?.lang || "en";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [activeTab, setActiveTab] = useState<TabType>("aircrafts");
  const [loading, setLoading] = useState(true);

  // Data lists
  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [showAllAircrafts, setShowAllAircrafts] = useState(false);

  // Action states (loading indicators for specific operations)
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Local inputs to modify URLs on the fly before saving
  const [tempUrls, setTempUrls] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Aircrafts (optionally filtered by image_needs_review)
      let query = supabase
        .from("aircraft_models")
        .select("*, manufacturers(name)")
        .order("model_name");

      if (!showAllAircrafts) {
        query = query.eq("image_needs_review", true);
      }

      const { data: aircraftData, error: aircraftError } = await query;
      
      if (!aircraftError && aircraftData) {
        setAircrafts(aircraftData as unknown as AircraftModel[]);
        // Initialize temp URLs
        aircraftData.forEach((a) => {
          setTempUrls((prev) => ({
            ...prev,
            [`${a.id}-house`]: a.house_livery_url || "",
            [`${a.id}-launch`]: a.launch_customer_livery_url || "",
          }));
        });
      }

      // 2. Fetch Airlines that need review
      const { data: airlineData, error: airlineError } = await supabase
        .from("airlines")
        .select("*")
        .eq("image_needs_review", true)
        .order("name");
      
      if (!airlineError && airlineData) {
        setAirlines(airlineData as Airline[]);
        airlineData.forEach((al) => {
          setTempUrls((prev) => ({
            ...prev,
            [`${al.id}-logo`]: al.logo_url || "",
          }));
        });
      }

      // 3. Fetch Airports that need review
      const { data: airportData, error: airportError } = await supabase
        .from("airports")
        .select("*")
        .eq("image_needs_review", true)
        .order("city");
      
      if (!airportError && airportData) {
        setAirports(airportData as Airport[]);
        airportData.forEach((ap) => {
          setTempUrls((prev) => ({
            ...prev,
            [`${ap.id}-image`]: ap.image_url || "",
          }));
        });
      }

    } catch (err) {
      console.error("Errore recupero dati revisione immagini:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, showAllAircrafts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleUpdateUrl = async (id: string, type: "house" | "launch" | "logo" | "image") => {
    const key = `${id}-${type}`;
    const value = tempUrls[key]?.trim() || "";
    
    setUpdatingId(key);
    try {
      let table = "";
      let payload: Record<string, string | null> = {};

      if (type === "house") {
        table = "aircraft_models";
        payload = { house_livery_url: value !== "" ? value : null };
      } else if (type === "launch") {
        table = "aircraft_models";
        payload = { launch_customer_livery_url: value !== "" ? value : null };
      } else if (type === "logo") {
        table = "airlines";
        payload = { logo_url: value !== "" ? value : null };
      } else if (type === "image") {
        table = "airports";
        payload = { image_url: value !== "" ? value : null };
      }

      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id);

      if (error) {
        alert(`Errore salvataggio URL: ${error.message}`);
      } else {
        // Update local lists state
        if (table === "aircraft_models") {
          setAircrafts((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    house_livery_url: type === "house" ? (value !== "" ? value : null) : a.house_livery_url,
                    launch_customer_livery_url: type === "launch" ? (value !== "" ? value : null) : a.launch_customer_livery_url,
                  }
                : a
            )
          );
        } else if (table === "airlines") {
          setAirlines((prev) =>
            prev.map((a) => (a.id === id ? { ...a, logo_url: value !== "" ? value : null } : a))
          );
        } else if (table === "airports") {
          setAirports((prev) =>
            prev.map((a) => (a.id === id ? { ...a, image_url: value !== "" ? value : null } : a))
          );
        }
        alert("URL aggiornato correttamente!");
      }
    } catch (err: unknown) {
      alert(`Si è verificato un errore: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveFlag = async (id: string, tab: TabType) => {
    const table = tab === "aircrafts" ? "aircraft_models" : tab === "airlines" ? "airlines" : "airports";
    
    setUpdatingId(`resolve-${id}`);
    try {
      const { error } = await supabase
        .from(table)
        .update({ image_needs_review: false })
        .eq("id", id);

      if (error) {
        alert(`Errore durante la risoluzione: ${error.message}`);
      } else {
        // Remove from local list
        if (tab === "aircrafts") {
          setAircrafts((prev) => prev.filter((a) => a.id !== id));
        } else if (tab === "airlines") {
          setAirlines((prev) => prev.filter((a) => a.id !== id));
        } else if (tab === "airports") {
          setAirports((prev) => prev.filter((a) => a.id !== id));
        }
      }
    } catch (err: unknown) {
      alert(`Si è verificato un errore: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
    type: "house" | "launch" | "logo" | "image"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const key = `${id}-${type}`;
    setUploadingId(key);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      let storagePath = "";
      let table = "";
      let updateColumn = "";

      if (type === "house" || type === "launch") {
        storagePath = `liveries/${id}-${timestamp}.${ext}`;
        table = "aircraft_models";
        updateColumn = type === "house" ? "house_livery_url" : "launch_customer_livery_url";
      } else if (type === "logo") {
        storagePath = `airlines/${id}-${timestamp}.${ext}`;
        table = "airlines";
        updateColumn = "logo_url";
      } else if (type === "image") {
        storagePath = `airports/${id}-${timestamp}.${ext}`;
        table = "airports";
        updateColumn = "image_url";
      }

      // Upload to bucket 'aircraft_images'
      const { error: uploadError } = await supabase.storage
        .from("aircraft_images")
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("aircraft_images")
        .getPublicUrl(storagePath);

      // Save to database
      const { error: dbError } = await supabase
        .from(table)
        .update({ [updateColumn]: publicUrl })
        .eq("id", id);

      if (dbError) throw dbError;

      // Update tempUrl state and table lists
      setTempUrls((prev) => ({
        ...prev,
        [key]: publicUrl,
      }));

      if (table === "aircraft_models") {
        setAircrafts((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  house_livery_url: type === "house" ? publicUrl : a.house_livery_url,
                  launch_customer_livery_url: type === "launch" ? publicUrl : a.launch_customer_livery_url,
                }
              : a
          )
        );
      } else if (table === "airlines") {
        setAirlines((prev) =>
          prev.map((a) => (a.id === id ? { ...a, logo_url: publicUrl } : a))
        );
      } else if (table === "airports") {
        setAirports((prev) =>
          prev.map((a) => (a.id === id ? { ...a, image_url: publicUrl } : a))
        );
      }

      alert("Immagine caricata e aggiornata nel database!");
    } catch (err: unknown) {
      console.error("Errore upload file:", err);
      alert(`Si è verificato un errore durante l'upload: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingId(null);
      // Reset current target value so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
            <span className="text-red-500 animate-pulse">🚩</span> REVISIONE IMMAGINI
          </h1>
          <p className="text-slate-400 font-mono text-xs uppercase mt-1">
            Gestione e moderazione delle immagini segnalate per scarsa qualità, errori o foto errate
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-xl gap-2 max-w-lg">
        <button
          onClick={() => setActiveTab("aircrafts")}
          className={`flex-1 py-2.5 px-4 text-center rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTab === "aircrafts"
              ? "bg-slate-950 text-cyan-400 border border-slate-800 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ✈️ Aerei ({aircrafts.length})
        </button>
        <button
          onClick={() => setActiveTab("airlines")}
          className={`flex-1 py-2.5 px-4 text-center rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTab === "airlines"
              ? "bg-slate-950 text-cyan-400 border border-slate-800 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🏢 Compagnie ({airlines.length})
        </button>
        <button
          onClick={() => setActiveTab("airports")}
          className={`flex-1 py-2.5 px-4 text-center rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
            activeTab === "airports"
              ? "bg-slate-950 text-cyan-400 border border-slate-800 shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🌍 Aeroporti ({airports.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-cyan-500 font-mono text-xs animate-pulse">
          Caricamento segnalazioni in corso...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB AEREI */}
          {activeTab === "aircrafts" && (
            <div className="space-y-6">
              {/* Opzione Filtro */}
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl max-w-md shadow-md">
                <input
                  type="checkbox"
                  id="showAllAircrafts"
                  checked={showAllAircrafts}
                  onChange={(e) => setShowAllAircrafts(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="showAllAircrafts" className="text-xs font-mono text-slate-300 cursor-pointer select-none">
                  Mostra tutti i {showAllAircrafts ? aircrafts.length : "400+"} aeromobili della flotta
                </label>
              </div>

              {aircrafts.length === 0 ? (
                <div className="border border-dashed border-slate-800 bg-slate-950/10 text-center py-16 text-slate-500 font-mono text-xs rounded-xl">
                  Nessun aeromobile ha immagini segnalate da revisionare. Ottimo lavoro!
                </div>
              ) : (
                <div className="space-y-6">
                  {aircrafts.map((aircraft) => (
                    <div key={aircraft.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
                      
                      {/* Info Modello */}
                      <div className="xl:col-span-3 space-y-2">
                        <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                          {aircraft.manufacturers?.name || "Aviation"}
                        </span>
                        <h3 className="text-lg font-extrabold text-white">{aircraft.model_name}</h3>
                        <div className="text-[10px] font-mono text-slate-500">ID: {aircraft.id}</div>
                        
                        <div className="pt-4">
                          <button
                            disabled={updatingId === `resolve-${aircraft.id}`}
                            onClick={() => handleResolveFlag(aircraft.id, "aircrafts")}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase py-2.5 rounded-lg transition-all shadow-md hover:shadow-emerald-500/10 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {updatingId === `resolve-${aircraft.id}` ? "Risoluzione..." : "✔️ Segna come Risolto"}
                          </button>
                        </div>
                      </div>

                      {/* Modulo Livrea Standard */}
                      <div className="xl:col-span-4 border border-slate-800/80 bg-slate-950/40 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                          <span className="text-xs font-mono font-bold text-slate-300">Livrea Standard (House)</span>
                        </div>
                        
                        {aircraft.house_livery_url ? (
                          <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
                            <img src={aircraft.house_livery_url} alt="House Livery" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-32 w-full border border-dashed border-slate-850 bg-slate-950/60 rounded-lg flex items-center justify-center text-slate-600 text-[10px]">
                            Nessuna foto associata
                          </div>
                        )}

                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="URL Immagine Standard"
                              value={tempUrls[`${aircraft.id}-house`] || ""}
                              onChange={(e) => setTempUrls({ ...tempUrls, [`${aircraft.id}-house`]: e.target.value })}
                              className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white placeholder:text-slate-700"
                            />
                            <button
                              disabled={updatingId === `${aircraft.id}-house`}
                              onClick={() => handleUpdateUrl(aircraft.id, "house")}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Salva
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type="file"
                              id={`file-house-${aircraft.id}`}
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, aircraft.id, "house")}
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-house-${aircraft.id}`}
                              className="w-full border border-slate-850 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] uppercase font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              {uploadingId === `${aircraft.id}-house` ? "Caricamento in corso..." : "📤 Carica File (House)"}
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Modulo Livrea Lancio */}
                      <div className="xl:col-span-5 border border-slate-800/80 bg-slate-950/40 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                          <span className="text-xs font-mono font-bold text-slate-300">Livrea Cliente di Lancio (Launch Customer)</span>
                        </div>
                        
                        {aircraft.launch_customer_livery_url ? (
                          <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
                            <img src={aircraft.launch_customer_livery_url} alt="Launch Livery" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-32 w-full border border-dashed border-slate-850 bg-slate-950/60 rounded-lg flex items-center justify-center text-slate-600 text-[10px]">
                            Nessuna foto associata
                          </div>
                        )}

                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="URL Immagine Lancio"
                              value={tempUrls[`${aircraft.id}-launch`] || ""}
                              onChange={(e) => setTempUrls({ ...tempUrls, [`${aircraft.id}-launch`]: e.target.value })}
                              className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white placeholder:text-slate-700"
                            />
                            <button
                              disabled={updatingId === `${aircraft.id}-launch`}
                              onClick={() => handleUpdateUrl(aircraft.id, "launch")}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Salva
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type="file"
                              id={`file-launch-${aircraft.id}`}
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, aircraft.id, "launch")}
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-launch-${aircraft.id}`}
                              className="w-full border border-slate-850 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] uppercase font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              {uploadingId === `${aircraft.id}-launch` ? "Caricamento in corso..." : "📤 Carica File (Launch)"}
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB COMPAGNIE */}
          {activeTab === "airlines" && (
            airlines.length === 0 ? (
              <div className="border border-dashed border-slate-800 bg-slate-950/10 text-center py-16 text-slate-500 font-mono text-xs rounded-xl">
                Nessun logo di compagnia aerea ha segnalazioni di revisione attive.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {airlines.map((airline) => (
                  <div key={airline.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-extrabold text-white font-sans">{airline.name}</h3>
                          <span className="text-[10px] text-slate-500 font-mono block">Nazione: {airline.country}</span>
                        </div>
                        <div className="flex gap-2">
                          {airline.iata_code && <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 font-mono text-[10px] font-bold">IATA: {airline.iata_code}</span>}
                          {airline.icao_code && <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-900 text-purple-400 font-mono text-[10px] font-bold">ICAO: {airline.icao_code}</span>}
                        </div>
                      </div>
                      
                      {airline.logo_url ? (
                        <div className="h-32 w-full rounded-xl bg-white border border-slate-850 p-4 flex items-center justify-center">
                          <img src={airline.logo_url} alt={airline.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-32 w-full border border-dashed border-slate-850 bg-slate-950/40 rounded-xl flex items-center justify-center text-slate-650 text-[10px]">
                          Nessun logo associato
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 font-mono text-xs border-t border-slate-800/80 pt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL Logo Vettore"
                          value={tempUrls[`${airline.id}-logo`] || ""}
                          onChange={(e) => setTempUrls({ ...tempUrls, [`${airline.id}-logo`]: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white placeholder:text-slate-700"
                        />
                        <button
                          disabled={updatingId === `${airline.id}-logo`}
                          onClick={() => handleUpdateUrl(airline.id, "logo")}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Salva
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="file"
                            id={`file-logo-${airline.id}`}
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, airline.id, "logo")}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-logo-${airline.id}`}
                            className="w-full border border-slate-850 bg-slate-950 hover:bg-slate-800 text-slate-350 text-[10px] uppercase font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            {uploadingId === `${airline.id}-logo` ? "Caricamento..." : "📤 Carica Logo"}
                          </label>
                        </div>

                        <button
                          disabled={updatingId === `resolve-${airline.id}`}
                          onClick={() => handleResolveFlag(airline.id, "airlines")}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase py-2.5 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {updatingId === `resolve-${airline.id}` ? "Risoluzione..." : "✔️ Risolto"}
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB AEROPORTI */}
          {activeTab === "airports" && (
            airports.length === 0 ? (
              <div className="border border-dashed border-slate-800 bg-slate-950/10 text-center py-16 text-slate-500 font-mono text-xs rounded-xl">
                Nessun aeroporto ha immagini da revisionare.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {airports.map((airport) => (
                  <div key={airport.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-extrabold text-white font-sans">{airport.name}</h3>
                          <span className="text-[10px] text-slate-500 font-mono block">Ubicazione: {airport.city}, {airport.country}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 font-mono text-[10px] font-bold">{airport.iata_code}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-900 text-purple-400 font-mono text-[10px] font-bold">{airport.icao_code}</span>
                        </div>
                      </div>
                      
                      {airport.image_url ? (
                        <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-850">
                          <img src={airport.image_url} alt={airport.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-32 w-full border border-dashed border-slate-850 bg-slate-950/40 rounded-xl flex items-center justify-center text-slate-650 text-[10px]">
                          Nessuna foto associata
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 font-mono text-xs border-t border-slate-800/80 pt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="URL Foto Scalo"
                          value={tempUrls[`${airport.id}-image`] || ""}
                          onChange={(e) => setTempUrls({ ...tempUrls, [`${airport.id}-image`]: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white placeholder:text-slate-700"
                        />
                        <button
                          disabled={updatingId === `${airport.id}-image`}
                          onClick={() => handleUpdateUrl(airport.id, "image")}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Salva
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="file"
                            id={`file-image-${airport.id}`}
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, airport.id, "image")}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-image-${airport.id}`}
                            className="w-full border border-slate-850 bg-slate-950 hover:bg-slate-800 text-slate-350 text-[10px] uppercase font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            {uploadingId === `${airport.id}-image` ? "Caricamento..." : "📤 Carica Foto"}
                          </label>
                        </div>

                        <button
                          disabled={updatingId === `resolve-${airport.id}`}
                          onClick={() => handleResolveFlag(airport.id, "airports")}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase py-2.5 rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {updatingId === `resolve-${airport.id}` ? "Risoluzione..." : "✔️ Risolto"}
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}
