"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Cropper from "react-easy-crop";
import { AircraftModel } from "../../../../types";

// --- TIPI ---
type SortKey = "manufacturer" | "model_name" | "type" | "first_flight_year" | "rarity" | "status";
type SortOrder = "asc" | "desc";

// --- UTILITY PER IL CROP E LA COMPRESSIONE WEBP ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Per evitare problemi di CORS se presenti
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  // Imposta le dimensioni del canvas uguali all'area ritagliata
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Disegna l'immagine ritagliata sul canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Esporta come WebP ad alta qualità (0.9) - Ottima compressione, perdita quasi nulla
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/webp",
      0.9 
    );
  });
}

export default function QuickEditorPage() {
  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingIds, setUploadingIds] = useState<string[]>([]);
  
  const [sortKey, setSortKey] = useState<SortKey>("manufacturer");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // --- STATI PER IL CROPPER ---
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [targetAircraftId, setTargetAircraftId] = useState<string | null>(null);
  
  interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAircrafts = async () => {
      const { data, error } = await supabase
        .from("aircraft_models")
        .select(`*, manufacturers (name)`);

      if (error) {
        console.error("Errore nel recupero dati:", error);
      } else {
        setAircrafts(data as AircraftModel[]);
      }
      setLoading(false);
    };

    fetchAircrafts();
  }, [supabase]);

  // 1. L'utente seleziona il file: leggiamo e apriamo il cropper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, aircraftId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result?.toString() || null);
        setTargetAircraftId(aircraftId);
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(file);
    }
    // Resetta l'input per permettere di selezionare lo stesso file
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: unknown, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 2. L'utente conferma il crop: generiamo il WebP e carichiamo su Supabase
  const handleUploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels || !targetAircraftId) return;

    setIsCropperOpen(false); // Chiudi la modale
    setUploadingIds((prev) => [...prev, targetAircraftId]);

    try {
      // Ottieni il Blob WebP dal canvas
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Errore nella generazione dell'immagine");

      const fileName = `${targetAircraftId}-${Date.now()}.webp`;
      const filePath = `liveries/${fileName}`;

      // Upload su Supabase (nota che carichiamo il file con content-type image/webp)
      const { error: uploadError } = await supabase.storage
        .from('aircraft_images')
        .upload(filePath, croppedImageBlob, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('aircraft_images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('aircraft_models')
        .update({ house_livery_url: publicUrl })
        .eq('id', targetAircraftId);

      if (dbError) throw dbError;

      // Aggiorna UI
      setAircrafts((prev) => 
        prev.map((a) => (a.id === targetAircraftId ? { ...a, house_livery_url: publicUrl } : a))
      );

    } catch (error) {
      console.error("Errore durante l'upload:", error);
      alert("Si è verificato un errore durante l'upload e la compressione.");
    } finally {
      setUploadingIds((prev) => prev.filter((id) => id !== targetAircraftId));
      // Pulisci lo stato
      setImageToCrop(null);
      setTargetAircraftId(null);
      setZoom(1);
    }
  };

  // 3. L'utente conferma l'elaborazione AI: genera il crop, invia all'API process-image, aggiorna DB
  const handleUploadProcessedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels || !targetAircraftId) return;

    setIsCropperOpen(false); // Chiudi la modale
    setUploadingIds((prev) => [...prev, targetAircraftId]);

    try {
      // Ottieni il Blob WebP dal canvas
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Errore nella generazione dell'immagine");

      const formData = new FormData();
      formData.append("file", croppedImageBlob, "cropped.webp");
      formData.append("aircraftId", targetAircraftId);

      const response = await fetch("/api/admin/process-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Errore durante l'elaborazione dell'immagine");
      }

      const publicUrl = result.publicUrl;

      // Aggiorna il database Supabase
      const { error: dbError } = await supabase
        .from('aircraft_models')
        .update({ house_livery_url: publicUrl })
        .eq('id', targetAircraftId);

      if (dbError) throw dbError;

      // Aggiorna UI locale
      setAircrafts((prev) => 
        prev.map((a) => (a.id === targetAircraftId ? { ...a, house_livery_url: publicUrl } : a))
      );

      alert("Immagine elaborata con AI e aggiornata con successo!");

    } catch (error: any) {
      console.error("Errore durante l'elaborazione AI:", error);
      alert(`Errore elaborazione AI: ${error.message || error}`);
    } finally {
      setUploadingIds((prev) => prev.filter((id) => id !== targetAircraftId));
      // Pulisci lo stato
      setImageToCrop(null);
      setTargetAircraftId(null);
      setZoom(1);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedAircrafts = useMemo(() => {
    const sortableItems = [...aircrafts];
    sortableItems.sort((a, b) => {
      const valA = (sortKey === "manufacturer" ? a.manufacturers?.name || "" : a[sortKey] || "") as string | number;
      const valB = (sortKey === "manufacturer" ? b.manufacturers?.name || "" : b[sortKey] || "") as string | number;

      let comparison = 0;
      if (valA < valB) comparison = -1;
      if (valA > valB) comparison = 1;

      if (sortKey === "manufacturer" && comparison === 0) {
        const modelA = a.model_name || "";
        const modelB = b.model_name || "";
        if (modelA < modelB) return sortOrder === "asc" ? -1 : 1;
        if (modelA > modelB) return sortOrder === "asc" ? 1 : -1;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sortableItems;
  }, [aircrafts, sortKey, sortOrder]);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'text-amber-500 bg-amber-500/10 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'EPIC': return 'text-purple-500 bg-purple-500/10 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case 'RARE': return 'text-blue-500 bg-blue-500/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'UNCOMMON': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'COMMON': return 'text-slate-400 bg-slate-400/10 border-slate-400/50';
      default: return 'text-slate-500 bg-slate-800 border-slate-700';
    }
  };

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortKey !== columnKey) return <span className="ml-1 opacity-20 group-hover:opacity-100">↕</span>;
    return sortOrder === "asc" ? <span className="ml-1 text-cyan-400">↑</span> : <span className="ml-1 text-cyan-400">↓</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-cyan-500">
        <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <p className="font-mono text-sm tracking-[0.2em] animate-pulse uppercase">Recupero Flotta Globale...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-50"></div>
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">Quick Editor</h2>
            <p className="text-slate-400 text-xs font-mono">Gestione massiva dell&apos;Opera Omnia</p>
          </div>
          <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-4 py-2 rounded text-xs font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            Totale Record: <strong className="text-white ml-1">{aircrafts.length}</strong>
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-20 shadow-md select-none">
              <tr className="text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 w-20">Foto</th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("manufacturer")}>
                  Costruttore {renderSortIcon("manufacturer")}
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("model_name")}>
                  Modello {renderSortIcon("model_name")}
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("type")}>
                  Tipo {renderSortIcon("type")}
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("first_flight_year")}>
                  Anno {renderSortIcon("first_flight_year")}
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("rarity")}>
                  Rarità {renderSortIcon("rarity")}
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort("status")}>
                  Status {renderSortIcon("status")}
                </th>
                <th className="p-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {sortedAircrafts.map((aircraft) => (
                <tr key={aircraft.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <label className="relative block w-16 h-9 bg-slate-800 rounded border border-slate-700 cursor-pointer overflow-hidden group/img hover:border-cyan-500 transition-colors">
                      {uploadingIds.includes(aircraft.id) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                          <div className="w-4 h-4 border-2 border-cyan-900 border-t-cyan-400 rounded-full animate-spin"></div>
                        </div>
                      ) : aircraft.house_livery_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={aircraft.house_livery_url} 
                          alt={aircraft.model_name} 
                          className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileSelect(e, aircraft.id)}
                      />
                    </label>
                  </td>
                  <td className="p-4 font-semibold text-slate-300">{aircraft.manufacturers?.name || 'Sconosciuto'}</td>
                  <td className="p-4 text-white font-bold">{aircraft.model_name}</td>
                  <td className="p-4 text-slate-400">{aircraft.type}</td>
                  <td className="p-4 text-slate-400 font-mono">{aircraft.first_flight_year || 'N/D'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider border rounded ${getRarityColor(aircraft.rarity)}`}>
                      {aircraft.rarity || 'N/D'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`flex items-center gap-2 text-xs font-mono ${aircraft.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${aircraft.status === 'ACTIVE' ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-amber-400 shadow-[0_0_5px_#fbbf24]'}`}></span>
                      {aircraft.status || 'N/D'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-cyan-500 hover:text-cyan-300 font-mono text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded border border-cyan-500/30 cursor-not-allowed">
                      Edita
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALE CROPPER OLOGRAFICO --- */}
      {isCropperOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] w-full max-w-3xl overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Inizializzazione Sensori Ottici</h3>
              <button 
                onClick={() => setIsCropperOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative w-full h-[60vh] bg-slate-950">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{ containerClassName: "w-full h-full", mediaClassName: "object-contain" }}
              />
            </div>

            <div className="p-6 bg-slate-900 border-t border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex-1 w-full flex items-center gap-4">
                  <span className="text-slate-400 font-mono text-xs">ZOOM</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setIsCropperOpen(false)}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded border border-slate-600 text-slate-300 font-mono text-sm hover:bg-slate-800 transition-colors"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={handleUploadCroppedImage}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded border border-cyan-800 text-cyan-400 font-mono text-sm hover:bg-cyan-950 transition-colors"
                  >
                    Ritaglia Standard (WebP)
                  </button>
                  <button 
                    onClick={handleUploadProcessedImage}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold font-mono text-sm tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-colors"
                  >
                    ✨ Rilavora con AI & Sky Overlay
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}