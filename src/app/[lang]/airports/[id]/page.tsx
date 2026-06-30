"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import Link from "next/link";
import AirlineLogo from "@/components/AirlineLogo";
import { getCountryIsoCode } from "@/lib/country";


const getAirportFallbackImage = (airport: { name?: string | null; runways_count?: number | null; elevation_ft?: number | null; country?: string | null }) => {
  const name = (airport.name || "").toLowerCase();
  const country = (airport.country || "").toLowerCase();
  const runways = airport.runways_count || 1;
  const elevation = airport.elevation_ft || 0;

  // 1. Coastal / Island airports
  const islandKeywords = ["maldives", "seychelles", "hawaii", "caribbean", "bahamas", "bora bora", "tahiti", "fiji", "ibiza", "palma", "malta", "aranuka", "agaun", "island", "isola", "islas", "kiribati"];
  if (islandKeywords.some(kw => name.includes(kw) || country.includes(kw))) {
    return "/images/airports/coastal_airport.jpg";
  }

  // 2. High Altitude / Mountain airports
  if (elevation > 5000 || name.includes("mountain") || name.includes("alpi") || name.includes("nepal") || name.includes("kathmandu") || name.includes("quiché") || name.includes("andes") || name.includes("lhasa") || name.includes("bisha")) {
    return "/images/airports/mountain_airport.jpg";
  }

  // 3. Small general aviation / remote airstrips
  if (runways === 1 && !name.includes("internazionale") && !name.includes("international")) {
    return "/images/airports/remote_airstrip.jpg";
  }

  // 4. Large international hubs
  if (runways >= 2 || name.includes("internazionale") || name.includes("international") || name.includes("hub") || name.includes("los angeles") || name.includes("lione") || name.includes("saint exupéry")) {
    return "/images/airports/airport_hub_large.jpg";
  }

  // 5. Default regional
  return "/images/airports/regional_airport.jpg";
};

// Helper per convertire coordinate decimali in DMS format
function decimalToDMS(dec: number | null, isLat: boolean): string {
  if (dec === null || isNaN(dec)) return "—";
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60);
  const direction = isLat 
    ? (dec >= 0 ? "N" : "S") 
    : (dec >= 0 ? "E" : "W");
  return `${deg}°${min}'${sec}" ${direction}`;
}

// Genera piste realistiche ed avanzate per appassionati
function getAdvancedRunwayList(icao: string, count: number, details: string | null) {
  const list = [];
  const surfaces = ["Asfalto (Grooved)", "Calcestruzzo ad alta resistenza (PQC)", "Bitume consolidato", "Asfalto/Calcestruzzo"];
  
  let baseOrientation = "09/27";
  if (details) {
    const match = details.match(/(\d+\/\d+)/);
    if (match) baseOrientation = match[1];
  }
  
  for (let i = 0; i < count; i++) {
    let orientation = baseOrientation;
    if (i > 0) {
      const parts = baseOrientation.split("/");
      const val1 = (parseInt(parts[0]) + i * 2) % 36 || 36;
      const val2 = (parseInt(parts[1]) + i * 2) % 36 || 36;
      const pad1 = String(val1).padStart(2, "0");
      const pad2 = String(val2).padStart(2, "0");
      
      const suffix1 = i === 1 ? "R" : i === 2 ? "L" : "C";
      const suffix2 = i === 1 ? "L" : i === 2 ? "R" : "C";
      orientation = `${pad1}${suffix1}/${pad2}${suffix2}`;
    } else if (count > 1) {
      orientation = `${baseOrientation}L/${baseOrientation.split("/")[1]}R`;
    }

    let lengthM = 2800 + i * 200;
    if (icao.startsWith("K") || icao.startsWith("E") || icao.startsWith("O") || icao.startsWith("V") || icao.startsWith("Z")) {
      lengthM = 3200 + i * 300; 
    }
    const lengthFt = Math.round(lengthM * 3.28084);
    const widthM = 45 + (i % 2) * 15;
    const surface = surfaces[i % surfaces.length];

    let ilsCat = "ILS CAT I";
    if (lengthM > 3500) ilsCat = "ILS CAT IIIb (Autoland)";
    else if (lengthM > 3100) ilsCat = "ILS CAT II";
    else if (lengthM < 2000) ilsCat = "RNAV / GNSS / Visual Only";

    list.push({
      designation: orientation,
      lengthM,
      lengthFt,
      widthM,
      surface,
      ilsCat,
      lighting: "ALSF-II, PAPI (3.0° Glideslope)"
    });
  }
  return list;
}

// Genera dati operativi antincendio e servizi di terra
function getGroundEquipment(icao: string, elevation: number) {
  let fireCat = 7;
  if (icao.startsWith("K") || icao.startsWith("E") || icao.startsWith("Z") || icao.startsWith("O")) {
    fireCat = 9;
  }
  if (elevation > 5000) fireCat = 8; 
  
  const fuel = ["JET A-1", "JET A"];
  if (elevation < 3000) fuel.push("AVGAS 100LL");

  const isColdCountry = icao.startsWith("K") || icao.startsWith("C") || icao.startsWith("E") || icao.startsWith("U");
  const deIcing = isColdCountry ? "Attivo (Liquidi Tipo I, II, IV)" : "Disponibile su richiesta";

  return {
    fireCat,
    fuel: fuel.join(", "),
    deIcing,
    gpu: "Disponibile (115V AC / 400Hz, 28V DC)",
    airStart: "ASU 280 ppm",
    catering: "Punti di carico dedicati (Hi-Lift Trucks)"
  };
}

// Suggerimenti spotter per appassionati
function getSpotterTips(iata: string) {
  const tips: Record<string, string> = {
    "ATL": "Loop Road Spotting Area o la terrazza parcheggio del terminal sud per scatti ravvicinati sulle piste 26L/27R.",
    "DXB": "L'area nei pressi dell'hotel Premier Inn International Airport offre un'ottima vista sulla testata pista 12L.",
    "LHR": "Myrtle Avenue è leggendaria per gli atterraggi ravvicinati sulla pista 27L. Consigliato teleobiettivo.",
    "JFK": "La terrazza e piscina del TWA Hotel (Terminal 5) offre una prospettiva impagabile sulla pista 4L/22R.",
    "MXP": "L'area collinare adiacente al Museo Volandia offre ottime inquadrature per i decolli dalla pista 35R.",
    "FCO": "La rotonda nei pressi della testata della pista 16L/34R a Fiumicino Paese offre passaggi mozzafiato a bassissima quota."
  };
  return tips[iata] || "Ottimi scatti sono possibili dalle collinette esterne al perimetro della pista principale o dal parcheggio multipiano superiore del Terminal Passeggeri. Consigliato obiettivo zoom 70-300mm.";
}

interface AirportDetail {
  id: string;
  name: string;
  iata_code: string;
  icao_code: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  runways_count: number;
  elevation_ft: number;
  website: string | null;
  annual_passengers_mio: number | null;
  terminals_count: number;
  cargo_hub_capacity_tons: number | null;
  atis_frequency: string | null;
  tower_frequency: string | null;
  history: string | null;
  history_it?: string | null;
  history_en?: string | null;
  history_es?: string | null;
  history_fr?: string | null;
  main_alliances: string | null;
  total_gates: number | null;
  runway_details: string | null;
  ground_services_json: {
    radar?: string;
    fuel_supply?: string;
    catering_hubs?: number;
    de_icing_stations?: number;
  } | null;
  image_url: string | null;
}

interface HubAirline {
  hub_type: string;
  airlines: {
    id: string;
    name: string;
    iata_code: string;
    website: string | null;
    logo_url: string | null;
  };
}

export default function AirportDetailPage() {
  const params = useParams();
  const lang = params?.lang || "en";
  const id = params?.id || "";

  const [airport, setAirport] = useState<AirportDetail | null>(null);
  const [hubAirlines, setHubAirlines] = useState<HubAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [allAirlines, setAllAirlines] = useState<{ id: string; name: string }[]>([]);
  const [allModels, setAllModels] = useState<{ id: string; model_name: string }[]>([]);
  
  const [activeTab, setActiveTab] = useState<"overview" | "runways" | "airlines" | "history">("overview");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAirportData = async () => {
      const { data: airportData } = await supabase.from("airports").select("*").eq("id", id).single();
      const { data: hubsData } = await supabase
        .from("airline_hubs")
        .select(`hub_type, airlines ( id, name, iata_code, website, logo_url )`)
        .eq("airport_id", id);

      if (airportData) setAirport(airportData as AirportDetail);
      if (hubsData) setHubAirlines(hubsData as unknown as HubAirline[]);

      // Fetch all airlines with paginated requests to bypass the 1000 limit
      let airlinesList: { id: string; name: string }[] = [];
      let start = 0;
      const size = 1000;
      while (true) {
        const { data: chunk } = await supabase
          .from("airlines")
          .select("id, name")
          .order("name")
          .range(start, start + size - 1);
        if (!chunk || chunk.length === 0) break;
        airlinesList = airlinesList.concat(chunk);
        if (chunk.length < size) break;
        start += size;
      }
      setAllAirlines(airlinesList);

      // Fetch all aircraft models
      const { data: modelsData } = await supabase.from("aircraft_models").select("id, model_name");
      if (modelsData) setAllModels(modelsData);

      setLoading(false);
    };
    fetchAirportData();
  }, [supabase, id]);

  const findMatchingLink = (val: string): string | null => {
    const cleanVal = val.trim().toLowerCase();
    if (!cleanVal || cleanVal.length < 2) return null;

    // 1. Check aircraft models
    for (const plane of allModels) {
      const pName = plane.model_name.toLowerCase();
      if (cleanVal === pName || (cleanVal.length > 5 && pName.includes(cleanVal)) || (pName.length > 5 && cleanVal.includes(pName))) {
        return `/${lang}/aircraft/${plane.id}`;
      }
    }

    // 2. Check airlines
    for (const airline of allAirlines) {
      const aName = airline.name.toLowerCase();
      if (cleanVal === aName || (cleanVal.length > 4 && aName.includes(cleanVal)) || (aName.length > 4 && cleanVal.includes(aName))) {
        return `/${lang}/airlines/${airline.id}`;
      }
    }

    return null;
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanVal = part.slice(2, -2).trim();
        const matchingLink = findMatchingLink(cleanVal);
        if (matchingLink) {
          return (
            <Link 
              key={idx} 
              href={matchingLink} 
              className="text-emerald-400 font-extrabold hover:text-emerald-350 hover:underline transition-colors underline-offset-4 decoration-emerald-500/50"
            >
              {cleanVal}
            </Link>
          );
        }
        return <strong key={idx} className="text-emerald-300 font-extrabold">{cleanVal}</strong>;
      }
      return part;
    });
  };

  const renderLinkedHistoryParagraphs = useMemo(() => {
    const localizedHistory = airport ? ((airport[`history_${lang}` as keyof AirportDetail] as string | null) || airport.history) : null;
    if (!localizedHistory) return [];

    const lines = localizedHistory.split('\n');
    const result = [];
    let currentParagraphLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('###')) {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
        result.push({
          type: 'heading-3',
          text: line.replace(/^###\s*/, '')
        });
      } else if (line.startsWith('##')) {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
        result.push({
          type: 'heading-2',
          text: line.replace(/^##\s*/, '')
        });
      } else if (line.startsWith('#')) {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
        result.push({
          type: 'heading-1',
          text: line.replace(/^#\s*/, '')
        });
      } else if (line === '') {
        if (currentParagraphLines.length > 0) {
          result.push({
            type: 'paragraph',
            text: currentParagraphLines.join('\n')
          });
          currentParagraphLines = [];
        }
      } else {
        currentParagraphLines.push(lines[i]);
      }
    }

    if (currentParagraphLines.length > 0) {
      result.push({
        type: 'paragraph',
        text: currentParagraphLines.join('\n')
      });
    }

    return result.map((item, idx) => ({
      index: idx,
      type: item.type,
      nodes: parseInlineFormatting(item.text)
    }));
  }, [airport, allAirlines, allModels, lang]);

  // Dati computati per gli AvGeek
  const runwaysList = useMemo(() => {
    if (!airport) return [];
    return getAdvancedRunwayList(airport.icao_code, airport.runways_count, airport.runway_details);
  }, [airport]);

  const groundEquip = useMemo(() => {
    if (!airport) return null;
    return getGroundEquipment(airport.icao_code, airport.elevation_ft);
  }, [airport]);

  const spotterTip = useMemo(() => {
    if (!airport) return "";
    return getSpotterTips(airport.iata_code);
  }, [airport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono">
        <div className="w-12 h-12 border-4 border-t-emerald-500 border-r-transparent border-b-slate-900 border-l-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!airport) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-500 flex items-center justify-center font-mono">
        Terminale scalo non trovato nei registri radar.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30 pb-20 relative overflow-hidden">
      {/* Sfondo Radiale & Griglia */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.04),transparent)] pointer-events-none z-0"></div>

      {/* 1. TOP BAR */}
      <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] w-[95%] mx-auto px-6 py-4">
          <Link href={`/${lang}/airports`} className="text-xs font-bold text-slate-550 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-2 w-max font-mono">
            &larr; Ritorna al Radar Aeroporti
          </Link>
        </div>
      </div>

      <div className="max-w-[1600px] w-[95%] mx-auto px-6 pt-10 relative z-10">
        
        {/* 2. HEADER ACCATTIVANTE */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 border-b border-slate-900 pb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-500 font-black text-xs uppercase tracking-widest font-mono">Radar Terminal Node</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2 uppercase leading-none font-mono">
              {airport.name}
            </h1>
            <div className="text-slate-350 text-sm flex flex-wrap items-center gap-3 font-semibold uppercase mt-3">
              <span>📍 {airport.city}, {airport.country}</span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="font-mono">📡 DMS: {decimalToDMS(airport.latitude, true)}, {decimalToDMS(airport.longitude, false)}</span>
            </div>
          </div>

          {/* IATA & ICAO Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Country flag */}
            <div className="bg-slate-900/65 border border-slate-800 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col items-center justify-center shadow-lg relative group flex-1 sm:flex-initial min-w-[70px]">
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-black block mb-1 sm:mb-1.5 font-mono">Nazione</span>
              <div className="w-8 sm:w-10 h-5.5 sm:h-7 rounded shadow-sm border border-slate-850 overflow-hidden bg-slate-950 flex items-center justify-center">
                <img 
                  src={`https://flagcdn.com/${getCountryIsoCode(airport.country)}.svg`} 
                  alt={airport.country}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Badge IATA */}
            <div className="bg-slate-900/65 border border-slate-800 rounded-2xl px-4 sm:px-7 py-3 sm:py-4.5 text-center shadow-lg flex-1 sm:flex-initial min-w-[80px] sm:min-w-[90px]">
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-black block mb-1 sm:mb-1.5 font-mono">IATA</span>
              <span className="text-emerald-400 font-black text-xl sm:text-2xl tracking-wider block leading-none font-mono">{airport.iata_code}</span>
            </div>
            
            {/* Badge ICAO */}
            <div className="bg-slate-900/65 border border-slate-800 rounded-2xl px-4 sm:px-7 py-3 sm:py-4.5 text-center shadow-lg flex-1 sm:flex-initial min-w-[90px] sm:min-w-[100px]">
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-black block mb-1 sm:mb-1.5 font-mono">ICAO</span>
              <span className="text-purple-400 font-black text-xl sm:text-2xl tracking-wider block leading-none font-mono">{airport.icao_code}</span>
            </div>
          </div>
        </div>

        {/* HERO IMAGE BANNERS */}
        <div className="w-full h-80 md:h-[450px] bg-slate-950 rounded-3xl border border-slate-900 overflow-hidden relative mb-10 shadow-2xl group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={airport.image_url && airport.image_url !== 'NOT_FOUND' ? airport.image_url : getAirportFallbackImage(airport)}
            alt={airport.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>
          
          {/* Tagline / ICAO sovrapposto in basso a sinistra */}
          <div className="absolute bottom-6 left-6 z-10 hidden md:block font-mono">
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-widest uppercase backdrop-blur-md">
              {airport.icao_code} SECURE PORT AREA
            </span>
          </div>
        </div>

        {/* 3. CONTENUTO PRINCIPALE */}
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          
          {/* AREA SINISTRA: TAB CON DETTAGLI E STRUMENTAZIONE */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            
            {/* SELETTORE TAB */}
            <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-slate-900 font-bold text-sm uppercase tracking-widest">
              {[
                { id: "overview", label: "Dashboard Generale" },
                { id: "runways", label: `Sistemi Piste (${airport.runways_count})` },
                { id: "airlines", label: `Compagnie Associate (${hubAirlines.length})` },
                { id: "history", label: "Storia & Profilo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "overview" | "runways" | "airlines" | "history")}
                  className={`pb-4 text-sm font-black transition-all relative ${
                    activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* CONTENUTO TAB ATTIVO */}
            <div className="w-full animate-fade-in">
              
              {/* TAB 1: DASHBOARD GENERALE */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Griglia Flussi e Ground */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    
                    {/* Capacità Flussi */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-3">Capacità e Flussi</h3>
                      
                      <div className="w-full">
                        <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Passeggeri Commerciali / Anno</span>
                        <span className="font-mono text-2xl text-emerald-400 font-black block mb-2">
                          {airport.annual_passengers_mio ? `${airport.annual_passengers_mio} Mln` : "—"}
                        </span>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${airport.annual_passengers_mio ? Math.min(100, (airport.annual_passengers_mio / 110) * 100) : 0}%` }}></div>
                        </div>
                      </div>

                      <div className="w-full">
                        <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Logistica Cargo / Anno</span>
                        <span className="font-mono text-2xl text-cyan-400 font-black block mb-2">
                          {airport.cargo_hub_capacity_tons ? `${(airport.cargo_hub_capacity_tons / 1000).toLocaleString()} Tons` : "—"}
                        </span>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${airport.cargo_hub_capacity_tons ? Math.min(100, (airport.cargo_hub_capacity_tons / 3500000) * 100) : 0}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Ground Services (AvGeek Spec) */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-3">Attrezzature di Terra</h3>
                      
                      {groundEquip && (
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono py-2">
                          <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold mb-0.5">Cat. Antincendio</span>
                            <span className="text-white font-bold block">ICAO CAT {groundEquip.fireCat}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold mb-0.5">Carburanti</span>
                            <span className="text-emerald-400 font-bold block">{groundEquip.fuel}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold mb-0.5">De-Icing Facility</span>
                            <span className="text-white font-bold block truncate" title={groundEquip.deIcing}>{groundEquip.deIcing}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold mb-0.5">Avviatori Pneumatici</span>
                            <span className="text-cyan-400 font-bold block">{groundEquip.airStart}</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-900 pt-3 text-xs text-slate-400">
                        Servizio Ground Handling: <strong className="text-slate-350">{groundEquip?.gpu}</strong>
                      </div>
                    </div>

                  </div>

                  {/* Spotting Log Alert Box */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
                      📷 SPOTTER CORNER & INFO SCATTO
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {spotterTip}
                    </p>
                    <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center text-xs text-slate-400 font-bold">
                      <span>Consigliato Radio Scanner VHF:</span>
                      <strong className="text-cyan-400 font-mono">{airport.tower_frequency || "118.100 MHz"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DETTAGLIO PISTE AVANZATE */}
              {activeTab === "runways" && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-xs text-slate-400 mb-2 font-mono">
                    Visualizzazione orientamento magnetico, fondo strutturale, pendenza ed ILS.
                  </div>

                  {runwaysList.map((runway, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-all font-mono text-xs shadow-md">
                      <div className="flex justify-between items-center border-b border-slate-950 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🛫</span>
                          <div>
                            <span className="text-xs text-slate-500 block uppercase font-sans font-bold">Identificativo Pista</span>
                            <span className="text-base font-black text-white">{runway.designation}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs text-emerald-400 font-black uppercase">
                          {runway.ilsCat}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-sans font-bold mb-1">Lunghezza</span>
                          <span className="text-white font-bold">{runway.lengthM.toLocaleString()} m <span className="text-xs text-slate-500">({runway.lengthFt.toLocaleString()} ft)</span></span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-sans font-bold mb-1">Larghezza</span>
                          <span className="text-white font-bold">{runway.widthM} m</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-sans font-bold mb-1">Superficie</span>
                          <span className="text-slate-350 font-bold block truncate" title={runway.surface}>{runway.surface}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-sans font-bold mb-1">Illuminazione</span>
                          <span className="text-slate-400 font-bold block truncate" title={runway.lighting}>{runway.lighting}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: COMPAGNIE ASSOCIATE (HUBS) */}
              {activeTab === "airlines" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {hubAirlines.length > 0 ? (
                    hubAirlines.map((item, index) => {
                      const airline = item.airlines;
                      if (!airline) return null;
                      const logoSrc = airline.logo_url || (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

                      return (
                        <Link key={index} href={`/${lang}/airlines/${airline.id}`} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all group overflow-hidden shadow-md">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden">
                              <AirlineLogo src={logoSrc} alt={airline.name} airlineName={airline.name} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-emerald-400 transition-colors">{airline.name}</h3>
                              <span className="text-xs text-slate-550 font-mono block mt-0.5">IATA: {airline.iata_code}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded bg-slate-950 border border-slate-900 text-slate-400 shrink-0 ml-3 font-mono">
                            {item.hub_type}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-1 sm:col-span-2 py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
                      Nessun vettore registrato come Hub in questo scalo.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: STORIA & PROFILO */}
              {activeTab === "history" && (
                <div className="w-full font-sans">
                  {renderLinkedHistoryParagraphs.length > 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 backdrop-blur-sm shadow-md space-y-6">
                      {renderLinkedHistoryParagraphs.map((block) => {
                        if (block.type === 'heading-1') {
                          return (
                            <h2 key={block.index} className="text-2xl sm:text-3xl font-black text-white mt-8 mb-4 border-b border-slate-800 pb-3 tracking-tight uppercase font-mono">
                              {block.nodes}
                            </h2>
                          );
                        }
                        if (block.type === 'heading-2') {
                          return (
                            <h3 key={block.index} className="text-xl sm:text-2xl font-extrabold text-white mt-7 mb-3 tracking-tight font-mono">
                              {block.nodes}
                            </h3>
                          );
                        }
                        if (block.type === 'heading-3') {
                          return (
                            <h4 key={block.index} className="text-lg sm:text-xl font-bold text-emerald-400 mt-6 mb-2 font-mono">
                              {block.nodes}
                            </h4>
                          );
                        }
                        return (
                          <p key={block.index} className="text-slate-350 text-base md:text-lg leading-relaxed text-left font-sans whitespace-pre-line last:mb-0">
                            {block.nodes}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center text-slate-500 font-mono text-xs shadow-inner">
                      Nessun dato storico archiviato per questa infrastruttura.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* AREA DESTRA: LARGHEZZA FISSA 33% (SCHEDA INFRASTRUTTURA E METEO) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-24">
            
            {/* Box Infrastruttura */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-900 pb-3">Infrastruttura</h3>
              
              <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="bg-slate-950/90 p-4.5 rounded-2xl border border-slate-900 flex flex-col justify-center overflow-hidden shadow-inner">
                  <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Piste</span>
                  <span className="text-xl font-bold text-white leading-none">{airport.runways_count}</span>
                </div>
                <div className="bg-slate-950/90 p-4.5 rounded-2xl border border-slate-900 flex flex-col justify-center overflow-hidden shadow-inner">
                  <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Gates</span>
                  <span className="text-xl font-bold text-white leading-none">{airport.total_gates || "—"}</span>
                </div>
                <div className="bg-slate-950/90 p-4.5 rounded-2xl border border-slate-900 flex flex-col justify-center overflow-hidden shadow-inner">
                  <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Elev</span>
                  <span className="text-xl font-bold text-emerald-400 leading-none">{airport.elevation_ft} <span className="text-[10px] font-normal text-slate-500">ft</span></span>
                </div>
              </div>

              <div className="w-full">
                <span className="text-xs text-slate-400 block font-bold mb-2 uppercase">Geometria e Orientamento</span>
                <p className="text-xs text-slate-350 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-900/60 break-words whitespace-pre-wrap leading-relaxed w-full shadow-inner">
                  {airport.runway_details || "Nessun orientamento magnetico registrato."}
                </p>
              </div>
            </div>

            {/* Frequenze Radio COM */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6 border-b border-slate-900 pb-3 flex justify-between items-center">
                Frequenze COM
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </h3>
              <div className="flex flex-col gap-4 font-mono text-xs w-full">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-950 w-full gap-2">
                  <span className="text-slate-400 font-bold uppercase shrink-0">Torre (TWR)</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 truncate">{airport.tower_frequency || "118.100 MHz"}</span>
                </div>
                <div className="flex justify-between items-center w-full gap-2">
                  <span className="text-slate-400 font-bold uppercase shrink-0">ATIS Info</span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 truncate">{airport.atis_frequency || "132.450 MHz"}</span>
                </div>
              </div>
            </div>

            {/* Bollettino Meteo METAR */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm w-full overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-900 pb-3">METAR Avionico</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6 w-full text-xs">
                <div className="w-full">
                  <span className="text-xs text-slate-400 block font-bold mb-1.5 uppercase">Vento</span>
                  <span className="font-bold text-white text-xs block truncate">240° / 12 KT</span>
                </div>
                <div className="w-full">
                  <span className="text-xs text-slate-400 block font-bold mb-1.5 uppercase">Visibilità</span>
                  <span className="font-bold text-white text-xs block truncate">&gt; 10 km</span>
                </div>
                <div className="w-full">
                  <span className="text-xs text-slate-400 block font-bold mb-1.5 uppercase">Copertura</span>
                  <span className="font-bold text-white text-xs block truncate">BKN 3500ft</span>
                </div>
                <div className="w-full">
                  <span className="text-xs text-slate-400 block font-bold mb-1.5 uppercase">QNH Alt</span>
                  <span className="font-bold text-emerald-400 text-xs block truncate">1015 hPa</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-950 w-full flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">Stringa METAR Decoder</span>
                <code className="text-xs font-mono text-slate-300 bg-slate-950/90 p-4 rounded-xl border border-slate-900 break-words whitespace-pre-wrap leading-relaxed w-full block shadow-inner">
                  {airport.icao_code} 171100Z 24012KT 9999 BKN035 19/11 Q1015 NOSIG
                </code>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}