"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface SpotterPhoto {
  id: string;
  photographer_name: string;
  image_url: string;
  registration_number?: string | null;
  notes?: string | null;
  created_at: string;
  airlines?: { name: string } | null;
  airports?: { name: string; iata_code: string } | null;
}

interface AirlineItem {
  id: string;
  name: string;
}

interface AirportItem {
  id: string;
  name: string;
  iata_code: string;
}

interface SpotterSectionProps {
  aircraftId: string;
  lang: string;
  initialPhotos: SpotterPhoto[];
  airlinesList: AirlineItem[];
  airportsList: AirportItem[];
}

export default function SpotterSection({
  aircraftId,
  lang,
  initialPhotos,
  airlinesList,
  airportsList,
}: SpotterSectionProps) {
  const [photos] = useState<SpotterPhoto[]>(initialPhotos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // STATI DEL FORM
  const [photographerName, setPhotographerName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [selectedAirlineId, setSelectedAirlineId] = useState("");
  const [selectedAirportId, setSelectedAirportId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // STATI DI CARICAMENTO / SUCCESSO
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !photographerName) {
      setErrorMsg("Nome fotografo e immagine sono obbligatori.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Upload del file su Supabase Storage (bucket 'spotters')
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${aircraftId}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("spotters")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Ottieni la URL pubblica dell'immagine
      const { data: { publicUrl } } = supabase.storage
        .from("spotters")
        .getPublicUrl(filePath);

      // 3. Inserisci il tracciamento nel DB in stato 'PENDING'
      const { error: dbError } = await supabase.from("spotter_uploads").insert({
        aircraft_id: aircraftId,
        airline_id: selectedAirlineId || null,
        airport_id: selectedAirportId || null,
        photographer_name: photographerName,
        image_url: publicUrl,
        registration_number: regNumber || null,
        notes: notes || null,
        status: "PENDING",
      });

      if (dbError) throw dbError;

      setSuccessMsg("Avvistamento registrato! Sarà visibile appena approvato dall'Admin.");
      // Pulisci campi
      setPhotographerName("");
      setRegNumber("");
      setSelectedAirlineId("");
      setSelectedAirportId("");
      setNotes("");
      setSelectedFile(null);
      
      // Chiudi modale dopo un po'
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 3000);

    } catch (err) {
      console.error(err);
      const error = err as Error;
      setErrorMsg(error.message || "Si è verificato un errore durante l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full border-t border-slate-800/60 mt-16 pt-10">
      
      {/* Intestazione Sezione */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-[0.3em] font-black flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Archivio Avvistamenti Spotter
          </h3>
          <p className="text-slate-500 text-sm font-mono mt-1">Immagini scattate dalla community in tutto il mondo</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded bg-cyan-600/10 hover:bg-cyan-500/20 text-cyan-400 font-bold font-mono text-sm uppercase tracking-widest border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        >
          Invia Foto Spotter
        </button>
      </div>

      {/* Galleria Foto Spotter */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden group shadow-md relative hover:border-cyan-500/30 transition-colors"
            >
              {/* Immagine */}
              <div className="h-44 bg-slate-900 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt={`Sighting by ${photo.photographer_name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {photo.registration_number && (
                  <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded text-sm font-mono font-bold uppercase tracking-wider">
                    REG: {photo.registration_number}
                  </span>
                )}
              </div>

              {/* Dati Telemetrici Foto */}
              <div className="p-4 font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-sans font-bold block">
                    📷 {photo.photographer_name}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(photo.created_at).toLocaleDateString(lang)}
                  </span>
                </div>
                
                {/* Dati combinati Compagnia/Aeroporto */}
                {(photo.airlines?.name || photo.airports?.name) && (
                  <div className="border-t border-slate-800/60 pt-2 mt-2 text-slate-400 space-y-1">
                    {photo.airlines?.name && (
                      <div className="truncate">
                        ✈️ <span className="text-slate-300 font-sans">{photo.airlines.name}</span>
                      </div>
                    )}
                    {photo.airports?.name && (
                      <div className="truncate">
                        📍 <span className="text-slate-300 font-sans">{photo.airports.name}</span>{" "}
                        <span className="text-cyan-400 text-sm">({photo.airports.iata_code})</span>
                      </div>
                    )}
                  </div>
                )}
                
                {photo.notes && (
                  <p className="mt-3 text-slate-500 font-sans text-sm italic line-clamp-2 leading-relaxed border-t border-slate-800/40 pt-2">
                    &quot;{photo.notes}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-slate-800 bg-slate-950/20 rounded-xl p-8 text-center text-slate-500 font-mono text-sm">
          Nessuna foto spotter caricata per questo velivolo. Sii il primo a registrarne una!
        </div>
      )}

      {/* --- MODALE CARICAMENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] w-full max-w-lg overflow-hidden flex flex-col relative">
            
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-md font-black text-white uppercase tracking-widest font-mono">
                Registra Avvistamento Ottico
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-800 text-red-400 text-sm font-mono rounded">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800 text-emerald-400 text-sm font-mono rounded animate-pulse">
                  ✅ {successMsg}
                </div>
              )}

              {/* Nome Fotografo */}
              <div>
                <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                  Nome Spotter / Firma Foto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mario Rossi"
                  value={photographerName}
                  onChange={(e) => setPhotographerName(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Matricola (Reg) */}
                <div>
                  <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                    Matricola (Reg Number)
                  </label>
                  <input
                    type="text"
                    placeholder="Es. A6-EVS"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-sans uppercase"
                  />
                </div>

                {/* Selezione Compagnia */}
                <div>
                  <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                    Compagnia Aerea
                  </label>
                  <select
                    value={selectedAirlineId}
                    onChange={(e) => setSelectedAirlineId(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-sans"
                  >
                    <option value="">Nessuna / Non rilevata</option>
                    {airlinesList.map((airline) => (
                      <option key={airline.id} value={airline.id}>
                        {airline.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selezione Aeroporto */}
              <div>
                <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                  Luogo di Avvistamento (Aeroporto)
                </label>
                <select
                  value={selectedAirportId}
                  onChange={(e) => setSelectedAirportId(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-sans"
                >
                  <option value="">Sconosciuto / In Volo</option>
                  {airportsList.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.name} ({airport.iata_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Immagine */}
              <div>
                <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                  File Immagine *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 rounded bg-slate-950 text-slate-400 border border-slate-800 text-sm focus:outline-none"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-slate-400 text-sm font-mono font-bold uppercase tracking-wider mb-1">
                  Dettagli o Note dello scatto
                </label>
                <textarea
                  placeholder="Es. Scattata in testata pista 36R al tramonto."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded bg-slate-950 text-white border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-sans"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded border border-slate-700 text-slate-400 font-mono text-sm uppercase hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-cyan-950 border-t-white rounded-full animate-spin"></div>
                      Caricamento...
                    </>
                  ) : (
                    "Invia Avvistamento"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
