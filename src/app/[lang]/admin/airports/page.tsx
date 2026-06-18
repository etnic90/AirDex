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

  // Modale Stati
  const [isOpen, setIsOpen] = useState(false);
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
        // Query con filtro di ricerca
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},iata_code.ilike.${term},icao_code.ilike.${term},city.ilike.${term},country.ilike.${term}`);
      }

      // Applica ordinamento e range di paginazione
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

  // Gestione ricerca: resetta la pagina corrente alla prima
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
    setIsOpen(true);
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
    setIsOpen(true);
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
        setIsOpen(false);
        fetchAirports();
      }
    } else {
      const { error } = await supabase
        .from("airports")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setIsOpen(false);
        fetchAirports();
      }
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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

      {/* Modale Creazione / Modifica */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-mono"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono mb-6 pb-2 border-b border-slate-850">
              {editingAirport ? "Modifica Aeroporto" : "Nuovo Aeroporto"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs text-slate-300">
              
              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1.5">Nome Aeroporto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  placeholder="Esempio: Aeroporto di Milano-Malpensa"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Codice IATA (3 Lettere)</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="MXP"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Codice ICAO (4 Lettere)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={icaoCode}
                    onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="LIMC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Città</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="Milano"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Nazione</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="Italia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Numero Piste</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={runwaysCount}
                    onChange={(e) => setRunwaysCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Elevazione (in Piedi)</label>
                  <input
                    type="number"
                    required
                    value={elevationFt}
                    onChange={(e) => setElevationFt(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="768"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Passeggeri/Anno (Milioni)</label>
                  <input
                    type="text"
                    value={annualPassengersMio}
                    onChange={(e) => setAnnualPassengersMio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="28.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1.5">URL Foto Anteprima</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  placeholder="https://images.unsplash.com/photo..."
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  Salva Aeroporto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
