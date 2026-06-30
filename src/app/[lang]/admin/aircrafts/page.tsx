"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

interface AircraftModel {
  id: string;
  model_name: string;
  manufacturer_id: string;
  iata_code: string | null;
  icao_code: string | null;
  type: string;
  engines: string | null;
  max_passengers: number | null;
  range_km: number | null;
  first_flight_year: number | null;
  status: string | null;
  rarity: string | null;
  description: string | null;
  trivia: string | null;
  era: string | null;
  house_livery_url: string | null;
  launch_customer_livery_url: string | null;
  image_needs_review?: boolean;
  manufacturers?: {
    name: string;
  } | null;
}

interface Manufacturer {
  id: string;
  name: string;
}

export default function AdminAircraftsManager() {
  const params = useParams();
  const lang = params?.lang || "en";

  const [aircrafts, setAircrafts] = useState<AircraftModel[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // View state: "list" o "edit"
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingAircraft, setEditingAircraft] = useState<AircraftModel | null>(null);

  // Form Stati
  const [modelName, setModelName] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [type, setType] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [engines, setEngines] = useState("");
  const [maxPassengers, setMaxPassengers] = useState<string>("");
  const [rangeKm, setRangeKm] = useState<string>("");
  const [firstFlightYear, setFirstFlightYear] = useState<string>("");
  const [status, setStatus] = useState("ACTIVE");
  const [rarity, setRarity] = useState("COMMON");
  const [description, setDescription] = useState("");
  const [trivia, setTrivia] = useState("");
  const [era, setEra] = useState("JET_AGE");
  const [houseLiveryUrl, setHouseLiveryUrl] = useState("");
  const [launchCustomerLiveryUrl, setLaunchCustomerLiveryUrl] = useState("");
  const [imageNeedsReview, setImageNeedsReview] = useState(false);

  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const triviaTextareaRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Carica i produttori per il dropdown del form
  useEffect(() => {
    const fetchManufacturers = async () => {
      const { data } = await supabase
        .from("manufacturers")
        .select("id, name")
        .order("name", { ascending: true });
      if (data) {
        setManufacturers(data);
        if (data.length > 0 && !manufacturerId) {
          setManufacturerId(data[0].id);
        }
      }
    };
    fetchManufacturers();
  }, [supabase, manufacturerId]);

  // Carica i velivoli paginati
  const fetchAircrafts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("aircraft_models")
        .select("*, manufacturers(name)", { count: "exact" });

      if (search.trim() !== "") {
        const term = `%${search.trim()}%`;
        query = query.or(`model_name.ilike.${term},type.ilike.${term},rarity.ilike.${term},era.ilike.${term}`);
      }

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data, count, error } = await query
        .order("model_name", { ascending: true })
        .range(start, end);

      if (!error && data) {
        setAircrafts(data as unknown as AircraftModel[]);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Errore recupero velivoli:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAircrafts();
  }, [fetchAircrafts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setEditingAircraft(null);
    setModelName("");
    setManufacturerId(manufacturers[0]?.id || "");
    setType("Narrow-Body Jet");
    setIataCode("");
    setIcaoCode("");
    setEngines("");
    setMaxPassengers("");
    setRangeKm("");
    setFirstFlightYear("");
    setStatus("ACTIVE");
    setRarity("COMMON");
    setDescription("");
    setTrivia("");
    setEra("JET_AGE");
    setHouseLiveryUrl("");
    setLaunchCustomerLiveryUrl("");
    setImageNeedsReview(false);
    setView("edit");
  };

  const handleOpenEdit = (aircraft: AircraftModel) => {
    setEditingAircraft(aircraft);
    setModelName(aircraft.model_name);
    setManufacturerId(aircraft.manufacturer_id);
    setType(aircraft.type);
    setIataCode(aircraft.iata_code || "");
    setIcaoCode(aircraft.icao_code || "");
    setEngines(aircraft.engines || "");
    setMaxPassengers(aircraft.max_passengers !== null ? String(aircraft.max_passengers) : "");
    setRangeKm(aircraft.range_km !== null ? String(aircraft.range_km) : "");
    setFirstFlightYear(aircraft.first_flight_year !== null ? String(aircraft.first_flight_year) : "");
    setStatus(aircraft.status || "ACTIVE");
    setRarity(aircraft.rarity || "COMMON");
    setDescription(aircraft.description || "");
    setTrivia(aircraft.trivia || "");
    setEra(aircraft.era || "JET_AGE");
    setHouseLiveryUrl(aircraft.house_livery_url || "");
    setLaunchCustomerLiveryUrl(aircraft.launch_customer_livery_url || "");
    setImageNeedsReview(aircraft.image_needs_review || false);
    setView("edit");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo modello aereo? Verranno rimosse anche tutte le foto degli spotter ed i record collegati a questo modello nel DB.")) return;
    
    const { error } = await supabase
      .from("aircraft_models")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      fetchAircrafts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !manufacturerId || !type.trim()) {
      alert("Nome Modello, Produttore e Tipo sono campi obbligatori.");
      return;
    }

    const payload = {
      model_name: modelName.trim(),
      manufacturer_id: manufacturerId,
      type: type.trim(),
      iata_code: iataCode.trim() !== "" ? iataCode.trim().toUpperCase() : null,
      icao_code: icaoCode.trim() !== "" ? icaoCode.trim().toUpperCase() : null,
      engines: engines.trim() !== "" ? engines.trim() : null,
      max_passengers: maxPassengers.trim() !== "" ? Number(maxPassengers) : null,
      range_km: rangeKm.trim() !== "" ? Number(rangeKm) : null,
      first_flight_year: firstFlightYear.trim() !== "" ? Number(firstFlightYear) : null,
      status,
      rarity,
      description: description.trim() !== "" ? description.trim() : null,
      trivia: trivia.trim() !== "" ? trivia.trim() : null,
      era,
      house_livery_url: houseLiveryUrl.trim() !== "" ? houseLiveryUrl.trim() : null,
      launch_customer_livery_url: launchCustomerLiveryUrl.trim() !== "" ? launchCustomerLiveryUrl.trim() : null,
      image_needs_review: imageNeedsReview,
    };

    if (editingAircraft) {
      const { error } = await supabase
        .from("aircraft_models")
        .update(payload)
        .eq("id", editingAircraft.id);

      if (error) {
        alert("Errore durante il salvataggio: " + error.message);
      } else {
        setView("list");
        fetchAircrafts();
      }
    } else {
      const { error } = await supabase
        .from("aircraft_models")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setView("list");
        fetchAircrafts();
      }
    }
  };

  const insertFormatting = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    before: string,
    after: string = ""
  ) => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "testo") + after;

    setter(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || "testo").length);
    }, 50);
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
                {editingAircraft ? "Modifica Velivolo" : "Nuovo Velivolo"}
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
              Salva Modello
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: EDITOR PRINCIPALE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Input Nome Modello */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <label className="block text-slate-400 uppercase font-mono text-xs font-bold">Nome Modello Aeromobile</label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Esempio: Boeing 777-300ER"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-4 rounded-xl text-lg font-bold text-white font-sans"
              />
            </div>

            {/* Descrizione Tecnica & Curiosità */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <span className="text-white font-mono text-xs font-black uppercase tracking-wider">
                  📝 Contenuto Editoriale
                </span>
                <span className="text-[9px] font-mono text-slate-500">FORMATTAZIONE RICCA / HTML DISPONIBILE</span>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Descrizione Tecnica */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-400 font-mono text-xs font-bold uppercase">Descrizione Tecnica</label>
                    {/* Toolbar per Descrizione */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => insertFormatting(descriptionTextareaRef, setDescription, "**", "**")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 font-bold rounded text-[10px]"
                        title="Grassetto"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting(descriptionTextareaRef, setDescription, "*", "*")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 italic rounded text-[10px]"
                        title="Corsivo"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting(descriptionTextareaRef, setDescription, "## ", "")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 font-mono rounded text-[10px]"
                        title="Intestazione 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting(descriptionTextareaRef, setDescription, "[link](", ")")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 rounded text-[9px] uppercase font-bold"
                        title="Inserisci Link"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={descriptionTextareaRef}
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-4 rounded-xl focus:border-cyan-500 focus:outline-none text-white text-xs font-sans leading-relaxed"
                    placeholder="Inserisci la scheda descrittiva, le note di sviluppo ed i dettagli storici dell'aereo..."
                  />
                </div>

                {/* Curiosità / Trivia */}
                <div className="space-y-2 pt-4 border-t border-slate-850">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-400 font-mono text-xs font-bold uppercase">Aneddoti / Curiosità</label>
                    {/* Toolbar per Trivia */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => insertFormatting(triviaTextareaRef, setTrivia, "**", "**")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 font-bold rounded text-[10px]"
                        title="Grassetto"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting(triviaTextareaRef, setTrivia, "*", "*")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 italic rounded text-[10px]"
                        title="Corsivo"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting(triviaTextareaRef, setTrivia, "[link](", ")")}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 rounded text-[9px] uppercase font-bold"
                        title="Inserisci Link"
                      >
                        Link
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={triviaTextareaRef}
                    rows={3}
                    value={trivia}
                    onChange={(e) => setTrivia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-4 rounded-xl focus:border-cyan-500 focus:outline-none text-white text-xs font-sans leading-relaxed"
                    placeholder="Inserisci pillole di curiosità ideali per i quiz e per la tessere informative degli avvistamenti..."
                  />
                </div>

              </div>
            </div>

            {/* Dati Tecnici / Performance */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>📊</span> Specifiche di Volo & Performance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Gruppo Motopropulsore (Engines)</label>
                  <input
                    type="text"
                    value={engines}
                    onChange={(e) => setEngines(e.target.value)}
                    placeholder="Es. 2x General Electric GE90-115B"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Capacità Passeggeri Max</label>
                  <input
                    type="number"
                    value={maxPassengers}
                    onChange={(e) => setMaxPassengers(e.target.value)}
                    placeholder="Es. 396"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Autonomia Massima (Km)</label>
                  <input
                    type="number"
                    value={rangeKm}
                    onChange={(e) => setRangeKm(e.target.value)}
                    placeholder="Es. 13649"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 uppercase font-bold">Anno Primo Volo</label>
                  <input
                    type="number"
                    value={firstFlightYear}
                    onChange={(e) => setFirstFlightYear(e.target.value)}
                    placeholder="Es. 1994"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: METADATI E SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Pubblicazione / Salvataggio */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>💾</span> Registrazione Modello
              </h3>
              <div className="text-xs font-mono text-slate-400 leading-relaxed font-sans">
                Stato di caricamento: <strong className="text-cyan-400">Database Live</strong>. Qualsiasi aggiornamento si ripercuoterà in tempo reale sulle schede taccuino degli spotter e sui quiz.
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Salva Velivolo
              </button>
            </div>

            {/* Widget 2: Produttore & Classificazione */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🛸</span> Classificazione
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Costruttore / Brand</label>
                  <select
                    required
                    value={manufacturerId}
                    onChange={(e) => setManufacturerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  >
                    <option value="" disabled>Seleziona produttore...</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Tipologia Velivolo</label>
                  <input
                    type="text"
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Es. Wide-Body Jet"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Widget 3: Indici Avionici */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>📟</span> Codici Avionici
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice IATA (3 Car.)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    placeholder="77W"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Codice ICAO (4 Car.)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={icaoCode}
                    onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                    placeholder="B77W"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Widget 4: AirDex Gamification */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>✨</span> Parametri AirDex
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Rarità Pokedex</label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  >
                    <option value="COMMON">COMMON (Comune)</option>
                    <option value="UNCOMMON">UNCOMMON (Non comune)</option>
                    <option value="RARE">RARE (Raro)</option>
                    <option value="EPIC">EPIC (Epico)</option>
                    <option value="LEGENDARY">LEGENDARY (Leggendario)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Epoca Storica (Era)</label>
                  <select
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  >
                    <option value="PIONEERS_OF_FLIGHT">PIONEERS OF FLIGHT (1910-1930)</option>
                    <option value="GOLDEN_AGE">GOLDEN AGE (1930-1950)</option>
                    <option value="JET_AGE">JET AGE (1950-1990)</option>
                    <option value="MODERN_ERA">MODERN ERA (1990-Presente)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">Stato Operativo</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  >
                    <option value="ACTIVE">ACTIVE (Attivo)</option>
                    <option value="HISTORIC">HISTORIC (Fuori servizio/Storico)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Widget 5: Livree & Foto */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 font-mono text-xs">
              <h3 className="text-white font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🖼️</span> Immagini e Livree
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 py-1.5 px-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="imageNeedsReview"
                    checked={imageNeedsReview}
                    onChange={(e) => setImageNeedsReview(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="imageNeedsReview" className="text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none">
                    🚩 Segnala immagine (Richiede revisione)
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-bold">URL Foto Livrea Standard (House)</label>
                  <input
                    type="text"
                    value={houseLiveryUrl}
                    onChange={(e) => setHouseLiveryUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                  {houseLiveryUrl.trim() !== "" && (
                    <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
                      <img src={houseLiveryUrl} alt="House Livery" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-850">
                  <label className="block text-slate-500 uppercase font-bold">URL Foto Livrea di Lancio (Launch Customer)</label>
                  <input
                    type="text"
                    value={launchCustomerLiveryUrl}
                    onChange={(e) => setLaunchCustomerLiveryUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                  {launchCustomerLiveryUrl.trim() !== "" && (
                    <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
                      <img src={launchCustomerLiveryUrl} alt="Launch Livery" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
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
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono">CPT: Aeromobili</h1>
          <p className="text-slate-400 font-mono text-xs uppercase">Gestione e censimento dei modelli aerei nel registro AirDex</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-lg font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
        >
          ➕ Aggiungi Velivolo
        </button>
      </div>

      {/* Cerca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Cerca per nome modello, tipologia, rarità, epoca..."
          value={search}
          onChange={handleSearchChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-3 rounded-lg font-mono text-xs text-white placeholder:text-slate-700"
        />
      </div>

      {/* Listato */}
      {loading ? (
        <div className="py-12 text-center text-cyan-500 font-mono text-xs animate-pulse">
          Caricamento modelli aerei in corso...
        </div>
      ) : aircrafts.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest font-black">
                    <th className="p-4">Foto</th>
                    <th className="p-4">Costruttore & Modello</th>
                    <th className="p-4">Codici</th>
                    <th className="p-4">Tipologia / Era</th>
                    <th className="p-4">Rarità / Stato</th>
                    <th className="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aircrafts.map((aircraft) => (
                    <tr key={aircraft.id} className="hover:bg-slate-950/20 transition-all">
                      <td className="p-4">
                        {(aircraft.house_livery_url || aircraft.launch_customer_livery_url) ? (
                          <img 
                            src={aircraft.house_livery_url || aircraft.launch_customer_livery_url || ""} 
                            alt={aircraft.model_name} 
                            className="w-16 h-10 object-cover rounded border border-slate-800"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-slate-950 border border-slate-850 rounded flex items-center justify-center text-[8px] text-slate-700">
                            NO IMAGE
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs font-sans">
                        <span className="text-cyan-400 font-bold block text-[10px] font-mono uppercase tracking-wider flex items-center gap-2">
                          {aircraft.manufacturers?.name || "Aviation"}
                          {aircraft.image_needs_review && (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-400 text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-0.5">
                              <span>🚩</span> REVISIONE
                            </span>
                          )}
                        </span>
                        <span className="text-white font-extrabold text-sm block mt-0.5">{aircraft.model_name}</span>
                      </td>
                      <td className="p-4 font-mono space-y-0.5">
                        <div className="text-slate-300">
                          IATA: <span className="text-emerald-400 font-bold">{aircraft.iata_code || "—"}</span>
                        </div>
                        <div className="text-slate-300">
                          ICAO: <span className="text-purple-400 font-bold">{aircraft.icao_code || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 font-sans">
                        <span className="text-slate-300 block">{aircraft.type}</span>
                        {aircraft.era && (
                          <span className="text-[10px] text-indigo-400 font-mono font-bold block mt-0.5 uppercase tracking-wider">
                            {aircraft.era.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono space-y-1">
                        <div>
                          {aircraft.rarity === "LEGENDARY" && <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[10px] font-black">LEGENDARY</span>}
                          {aircraft.rarity === "EPIC" && <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-450 text-[10px] font-black">EPIC</span>}
                          {aircraft.rarity === "RARE" && <span className="px-2 py-0.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-400 text-[10px] font-black">RARE</span>}
                          {aircraft.rarity === "UNCOMMON" && <span className="px-2 py-0.5 rounded bg-green-950/40 border border-green-500/30 text-green-400 text-[10px] font-black">UNCOMMON</span>}
                          {aircraft.rarity === "COMMON" && <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400 text-[10px] font-black">COMMON</span>}
                        </div>
                        <div>
                          {aircraft.status === "HISTORIC" ? (
                            <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-black">Storico</span>
                          ) : (
                            <span className="text-[10px] text-emerald-450/80 uppercase tracking-widest font-black">Attivo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(aircraft)}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(aircraft.id)}
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
                Trovati <strong className="text-slate-200">{totalCount}</strong> aeromobili
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
          Nessun aeromobile registrato corrisponde ai filtri impostati.
        </div>
      )}

    </div>
  );
}
