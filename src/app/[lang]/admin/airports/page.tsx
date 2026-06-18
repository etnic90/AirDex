"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

interface Airport {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  runways_count: number;
  elevation_ft: number;
  annual_passengers_mio: number | null;
  image_url: string | null;
}

export default function AdminAirportsManager() {
  const params = useParams();
  const lang = params?.lang || "en";

  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Editor View Mode: "list" o "edit"
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);

  // Form Stati
  const [name, setName] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [runwaysCount, setRunwaysCount] = useState(1);
  const [elevationFt, setElevationFt] = useState(0);
  const [annualPassengersMio, setAnnualPassengersMio] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAirports = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("airports")
        .select("*", { count: "exact" });

      if (search.trim() !== "") {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},iata_code.ilike.${term},icao_code.ilike.${term},city.ilike.${term},country.ilike.${term}`);
      }

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data, count, error } = await query
        .order("city", { ascending: true })
        .range(start, end);

      if (!error && data) {
        setAirports(data as Airport[]);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Errore recupero aeroporti:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, search]);

  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setEditingAirport(null);
    setName("");
    setIataCode("");
    setIcaoCode("");
    setCity("");
    setCountry("");
    setRunwaysCount(1);
    setElevationFt(0);
    setAnnualPassengersMio("");
    setImageUrl("");
    setView("edit");
  };

  const handleOpenEdit = (airport: Airport) => {
    setEditingAirport(airport);
    setName(airport.name);
    setIataCode(airport.iata_code);
    setIcaoCode(airport.icao_code);
    setCity(airport.city);
    setCountry(airport.country);
    setRunwaysCount(airport.runways_count);
    setElevationFt(airport.elevation_ft);
    setAnnualPassengersMio(airport.annual_passengers_mio !== null ? String(airport.annual_passengers_mio) : "");
    setImageUrl(airport.image_url || "");
    setView("edit");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo aeroporto? Eventuali voli e collegamenti ad esso associati potrebbero rompersi.")) return;
    
    const { error } = await supabase
      .from("airports")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      fetchAirports();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !iataCode.trim() || !icaoCode.trim() || !city.trim() || !country.trim()) {
      alert("Nome, IATA, ICAO, Città e Nazione sono obbligatori.");
      return;
    }

    const payload = {
      name: name.trim(),
      iata_code: iataCode.trim().toUpperCase(),
      icao_code: icaoCode.trim().toUpperCase(),
      city: city.trim(),
      country: country.trim(),
      runways_count: Number(runwaysCount),
      elevation_ft: Number(elevationFt),
      annual_passengers_mio: annualPassengersMio.trim() !== "" ? Number(annualPassengersMio) : null,
      image_url: imageUrl.trim() !== "" ? imageUrl.trim() : null,
    };

    if (editingAirport) {
      const { error } = await supabase
        .from("airports")
        .update(payload)
        .eq("id", editingAirport.id);

      if (error) {
        alert("Errore durante il salvataggio: " + error.message);
      } else {
        setView("list");
        fetchAirports();
      }
    } else {
      const { error } = await supabase
        .from("airports")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setView("list");
        fetchAirports();
      }
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (view === "edit") {
    return (
      <div className="space-y-6 text-slate-100 font-sans">
        
        {/* Editor TopBar */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("list")}
              className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              &larr; Torna alla lista
            </button>
            <div>
              <h1 className="text-xl font-black text-white font-mono uppercase tracking-wider">
                {editingAirport ? "Modifica Aeroporto" : "Nuovo Aeroporto"}
              </h1>
              <span className="text-[10px] text-slate-500 font-mono">WordPress-style Airport Editor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={(e) => handleSubmit(e)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
            >
              Salva Configurazione
            </button>
          </div>
        </div>

        {/* CPT Editor Form Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: DATI STRUTTURALI */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Nome dello scalo */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <label className="block text-slate-400 uppercase font-mono text-xs font-bold">Nome Aeroporto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Esempio: Aeroporto Internazionale Leonardo da Vinci"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-4 rounded-xl text-lg font-bold text-white font-sans"
              />
            </div>

            {/* Dettagli Tecnici Piste & Elevazione */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2">
                Specifiche Infrastruttura Scalo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Numero Piste</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={runwaysCount}
                    onChange={(e) => setRunwaysCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Elevazione (FT)</label>
                  <input
                    type="number"
                    required
                    value={elevationFt}
                    onChange={(e) => setElevationFt(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Passeggeri/Anno (Milioni)</label>
                  <input
                    type="text"
                    value={annualPassengersMio}
                    onChange={(e) => setAnnualPassengersMio(e.target.value)}
                    placeholder="Esempio: 43.5"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Ubicazione geografica */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2">
                Dati Geografici
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Città di Riferimento</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Roma"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Nazione</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Italia"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: METADATI E COPERTINA */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Pubblicazione / Salvataggio */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>💾</span> Registrazione CPT
              </h3>
              <div className="text-xs font-mono text-slate-400 leading-relaxed">
                Stato di caricamento: <strong className="text-cyan-400">Database Live</strong>. Eventuali modifiche si ripercuoteranno istantaneamente sulle schede scalo e sul radar di navigazione.
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Salva Modifiche
              </button>
            </div>

            {/* Widget 2: Codici Avionici */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>📟</span> Codici Identificazione
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice IATA (3 Car.)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    placeholder="FCO"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice ICAO (4 Car.)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={icaoCode}
                    onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                    placeholder="LIRF"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Widget 3: Foto Hub */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🖼️</span> Immagine Scalo
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">URL Foto</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                </div>
                {imageUrl.trim() !== "" ? (
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-850 relative">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-full border border-dashed border-slate-850 bg-slate-950/40 rounded-xl flex items-center justify-center text-slate-600 text-[10px] text-center px-4">
                    Nessuna immagine associata
                  </div>
                )}
              </div>
            </div>

          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono">CPT: Aeroporti</h1>
          <p className="text-slate-400 font-mono text-xs uppercase">Gestione e censimento degli scali aeroportuali commerciali</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-lg font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
        >
          ➕ Aggiungi Aeroporto
        </button>
      </div>

      {/* Cerca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Cerca per nome, codice IATA/ICAO, città o nazione..."
          value={search}
          onChange={handleSearchChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-3 rounded-lg font-mono text-xs text-white placeholder:text-slate-700"
        />
      </div>

      {/* Listato */}
      {loading ? (
        <div className="py-12 text-center text-cyan-500 font-mono text-xs animate-pulse">
          Caricamento aeroporti in corso...
        </div>
      ) : airports.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest font-black">
                    <th className="p-4">Foto</th>
                    <th className="p-4">Codici</th>
                    <th className="p-4">Nome Scalo</th>
                    <th className="p-4">Ubicazione</th>
                    <th className="p-4">Infrastruttura</th>
                    <th className="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {airports.map((airport) => (
                    <tr key={airport.id} className="hover:bg-slate-950/20 transition-all">
                      <td className="p-4">
                        {airport.image_url ? (
                          <img 
                            src={airport.image_url} 
                            alt={airport.name} 
                            className="w-16 h-10 object-cover rounded border border-slate-800"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-slate-950 border border-slate-850 rounded flex items-center justify-center text-[8px] text-slate-700">
                            NO IMAGE
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-bold block">{airport.iata_code}</span>
                        <span className="text-purple-400 block mt-0.5">{airport.icao_code}</span>
                      </td>
                      <td className="p-4 font-sans max-w-xs">
                        <span className="text-white font-bold block">{airport.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 block">{airport.city}</span>
                        <span className="text-slate-500 text-[10px] block">{airport.country}</span>
                      </td>
                      <td className="p-4 text-slate-450 space-y-0.5">
                        <div className="flex justify-between max-w-[120px]">
                          <span>Piste:</span>
                          <span className="text-slate-200 font-bold">{airport.runways_count}</span>
                        </div>
                        <div className="flex justify-between max-w-[120px]">
                          <span>Quota:</span>
                          <span className="text-slate-200 font-bold">{airport.elevation_ft} ft</span>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(airport)}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(airport.id)}
                          className="bg-red-950/10 hover:bg-red-950/30 border border-red-900/20 hover:border-red-500 text-red-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-xs text-slate-400">
              <div>
                Trovati <strong className="text-slate-200">{totalCount}</strong> aeroporti
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  &larr; Prev
                </button>
                <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 font-bold rounded">
                  {currentPage} di {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-slate-800 bg-slate-950/10 text-center py-12 text-slate-500 font-mono text-xs rounded-xl">
          Nessun aeroporto trovato corrispondente ai parametri inseriti.
        </div>
      )}

    </div>
  );
}
