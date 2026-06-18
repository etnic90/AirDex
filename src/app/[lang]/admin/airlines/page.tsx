"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

interface Airline {
  id: string;
  name: string;
  iata_code: string | null;
  icao_code: string | null;
  country: string;
  founded_year: number;
  closed_year: number | null;
  website: string | null;
  logo_url: string | null;
  callsign: string | null;
  alliance: string | null;
  main_hub: string | null;
  slogan: string | null;
}

export default function AdminAirlinesManager() {
  const params = useParams();
  const lang = params?.lang || "en";

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // View state: "list" o "edit"
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);

  // Form Stati
  const [name, setName] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [country, setCountry] = useState("");
  const [foundedYear, setFoundedYear] = useState(2000);
  const [closedYear, setClosedYear] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [callsign, setCallsign] = useState("");
  const [alliance, setAlliance] = useState("");
  const [mainHub, setMainHub] = useState("");
  const [slogan, setSlogan] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("airlines")
        .select("*", { count: "exact" });

      if (search.trim() !== "") {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},iata_code.ilike.${term},icao_code.ilike.${term},country.ilike.${term},callsign.ilike.${term}`);
      }

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data, count, error } = await query
        .order("name", { ascending: true })
        .range(start, end);

      if (!error && data) {
        setAirlines(data as Airline[]);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Errore recupero compagnie:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, search]);

  useEffect(() => {
    fetchAirlines();
  }, [fetchAirlines]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setEditingAirline(null);
    setName("");
    setIataCode("");
    setIcaoCode("");
    setCountry("");
    setFoundedYear(2000);
    setClosedYear("");
    setWebsite("");
    setLogoUrl("");
    setCallsign("");
    setAlliance("");
    setMainHub("");
    setSlogan("");
    setView("edit");
  };

  const handleOpenEdit = (airline: Airline) => {
    setEditingAirline(airline);
    setName(airline.name);
    setIataCode(airline.iata_code || "");
    setIcaoCode(airline.icao_code || "");
    setCountry(airline.country);
    setFoundedYear(airline.founded_year);
    setClosedYear(airline.closed_year !== null ? String(airline.closed_year) : "");
    setWebsite(airline.website || "");
    setLogoUrl(airline.logo_url || "");
    setCallsign(airline.callsign || "");
    setAlliance(airline.alliance || "");
    setMainHub(airline.main_hub || "");
    setSlogan(airline.slogan || "");
    setView("edit");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa compagnia? Verranno rimossi anche i collegamenti alla flotta nel database.")) return;
    
    const { error } = await supabase
      .from("airlines")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      fetchAirlines();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country.trim()) {
      alert("Nome e Nazione sono obbligatori.");
      return;
    }

    const payload = {
      name: name.trim(),
      iata_code: iataCode.trim() !== "" ? iataCode.trim().toUpperCase() : null,
      icao_code: icaoCode.trim() !== "" ? icaoCode.trim().toUpperCase() : null,
      country: country.trim(),
      founded_year: Number(foundedYear),
      closed_year: closedYear.trim() !== "" ? Number(closedYear) : null,
      website: website.trim() !== "" ? website.trim() : null,
      logo_url: logoUrl.trim() !== "" ? logoUrl.trim() : null,
      callsign: callsign.trim() !== "" ? callsign.trim().toUpperCase() : null,
      alliance: alliance.trim() !== "" ? alliance.trim() : null,
      main_hub: mainHub.trim() !== "" ? mainHub.trim() : null,
      slogan: slogan.trim() !== "" ? slogan.trim() : null,
    };

    if (editingAirline) {
      const { error } = await supabase
        .from("airlines")
        .update(payload)
        .eq("id", editingAirline.id);

      if (error) {
        alert("Errore durante il salvataggio: " + error.message);
      } else {
        setView("list");
        fetchAirlines();
      }
    } else {
      const { error } = await supabase
        .from("airlines")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setView("list");
        fetchAirlines();
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
                {editingAirline ? "Modifica Compagnia" : "Nuova Compagnia"}
              </h1>
              <span className="text-[10px] text-slate-500 font-mono">WordPress-style Editor Engine v2.0</span>
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
              Salva Compagnia
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: EDITOR PRINCIPALE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Input Nome Compagnia */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <label className="block text-slate-400 uppercase font-mono text-xs font-bold">Nome Vettore</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Esempio: ITA Airways"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-4 rounded-xl text-lg font-bold text-white font-sans"
              />
            </div>

            {/* Dati Operativi e Storici */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>📋</span> Specifiche Operative
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Nazione</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Esempio: Italia"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Alleanza Globale</label>
                  <input
                    type="text"
                    value={alliance}
                    onChange={(e) => setAlliance(e.target.value)}
                    placeholder="SkyTeam, Star Alliance, OneWorld..."
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Anno di Fondazione</label>
                  <input
                    type="number"
                    required
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Anno di Chiusura (Opzionale)</label>
                  <input
                    type="number"
                    value={closedYear}
                    onChange={(e) => setClosedYear(e.target.value)}
                    placeholder="Lascia vuoto se attiva"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-850">
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Hub Principale / Base Operativa</label>
                  <input
                    type="text"
                    value={mainHub}
                    onChange={(e) => setMainHub(e.target.value)}
                    placeholder="Aeroporto di Roma-Fiumicino (FCO)"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Motto / Slogan</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Slogan della compagnia..."
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: METADATI E LOGO */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Pubblicazione / Salvataggio */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>💾</span> Registrazione Vettore
              </h3>
              <div className="text-xs font-mono text-slate-400 leading-relaxed font-sans">
                Stato di caricamento: <strong className="text-cyan-400">Database Live</strong>. Qualsiasi aggiornamento si ripercuoterà in tempo reale sulle schede flotta, statistiche e radar.
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Salva Vettore
              </button>
            </div>

            {/* Widget 2: Codici Identificativi */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>📟</span> Codici Avionici
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice IATA (2 Car.)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    placeholder="AZ"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice ICAO (3 Car.)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={icaoCode}
                    onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                    placeholder="ITY"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Callsign Radio</label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    placeholder="ITARROW"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Widget 3: Logo ed Elementi Web */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🖼️</span> Logo & Media
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Sito Web Compagnia</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">URL Logo Vettore</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                </div>
                {logoUrl.trim() !== "" ? (
                  <div className="h-32 w-full rounded-xl bg-white border border-slate-850 relative p-4 flex items-center justify-center">
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-full border border-dashed border-slate-850 bg-slate-950/40 rounded-xl flex items-center justify-center text-slate-600 text-[10px] text-center px-4">
                    Nessun logo associato
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
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono">CPT: Compagnie Aeree</h1>
          <p className="text-slate-400 font-mono text-xs uppercase">Gestione e censimento dei vettori di volo commerciali globali</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-lg font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
        >
          ➕ Nuova Compagnia
        </button>
      </div>

      {/* Cerca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Cerca per nome, codice IATA/ICAO, nazione o callsign..."
          value={search}
          onChange={handleSearchChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-3 rounded-lg font-mono text-xs text-white placeholder:text-slate-700"
        />
      </div>

      {/* Listato */}
      {loading ? (
        <div className="py-12 text-center text-cyan-500 font-mono text-xs animate-pulse">
          Caricamento compagnie aeree...
        </div>
      ) : airlines.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest font-black">
                    <th className="p-4">Logo</th>
                    <th className="p-4">Nome Vettore</th>
                    <th className="p-4">Codici & Call</th>
                    <th className="p-4">Nazione / Alleanza</th>
                    <th className="p-4">Periodo Attività</th>
                    <th className="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {airlines.map((airline) => (
                    <tr key={airline.id} className="hover:bg-slate-950/20 transition-all">
                      <td className="p-4">
                        {airline.logo_url ? (
                          <div className="w-16 h-10 rounded bg-white flex items-center justify-center p-1 border border-slate-800">
                            <img 
                              src={airline.logo_url} 
                              alt={airline.name} 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-slate-950 border border-slate-850 rounded flex items-center justify-center text-[8px] text-slate-700">
                            NO LOGO
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-sans max-w-xs font-medium">
                        <span className="text-white font-bold block">{airline.name}</span>
                        {airline.website && (
                          <a 
                            href={airline.website} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-cyan-500 hover:underline block mt-0.5 truncate max-w-[200px]"
                          >
                            {airline.website}
                          </a>
                        )}
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="flex gap-2 text-slate-300">
                          <span className="text-emerald-400 font-bold">IATA: {airline.iata_code || "—"}</span>
                          <span className="text-purple-400">ICAO: {airline.icao_code || "—"}</span>
                        </div>
                        {airline.callsign && (
                          <span className="text-slate-500 text-[10px] block">CALL: {airline.callsign}</span>
                        )}
                      </td>
                      <td className="p-4 font-sans">
                        <span className="text-slate-300 block">{airline.country}</span>
                        {airline.alliance ? (
                          <span className="text-[10px] text-amber-500 font-mono font-bold block mt-0.5">{airline.alliance}</span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono block mt-0.5">Nessuna Alleanza</span>
                        )}
                      </td>
                      <td className="p-4">
                        {airline.closed_year ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900 text-amber-400 text-[10px] font-bold">
                            STORICO ({airline.founded_year} - {airline.closed_year})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900 text-emerald-400 text-[10px] font-bold">
                            ATTIVO (DAL {airline.founded_year})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(airline)}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(airline.id)}
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
                Trovati <strong className="text-slate-200">{totalCount}</strong> vettori
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
          Nessuna compagnia trovata corrispondente ai parametri inseriti.
        </div>
      )}

    </div>
  );
}
