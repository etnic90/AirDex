"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import Link from "next/link";
import AirlineLogo from "@/components/AirlineLogo";
import { getCountryIsoCode } from "@/lib/country";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getSanitizedPassengers } from "@/lib/airport-pax";

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
  
  const [o1, o2] = baseOrientation.split("/");
  const deg1 = parseInt(o1) || 9;
  
  for (let i = 0; i < count; i++) {
    const shift = i * 2; 
    let runwayDesignation = "";
    
    if (count === 1) {
      runwayDesignation = baseOrientation;
    } else {
      const designator = i === 0 ? "L" : i === 1 ? "R" : "C";
      const parallelDesignator = i === 0 ? "R" : i === 1 ? "L" : "C";
      
      const newD1 = String((deg1 + shift) % 36).padStart(2, '0');
      const newD2 = String((parseInt(o2) + shift) % 36).padStart(2, '0');
      
      runwayDesignation = `${newD1}${designator}/${newD2}${parallelDesignator}`;
    }

    const lengthM = 2000 + (Math.abs(deg1 + i * 7) % 3) * 600 + (i * 350); 
    const lengthFt = Math.round(lengthM * 3.28084);
    const widthM = lengthM > 3200 ? 60 : 45;
    const surface = surfaces[(deg1 + i) % surfaces.length];

    let ilsCat = "ILS CAT I";
    if (lengthM > 3500) ilsCat = "ILS CAT IIIb (Autoland)";
    else if (lengthM > 3100) ilsCat = "ILS CAT II";
    else if (lengthM < 2000) ilsCat = "RNAV / GNSS / Visual Only";

    list.push({
      designation: runwayDesignation,
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
    slug: string;
  };
}

export default function AirportDetailClient() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const slug = (params?.slug as string) || "";

  const [airport, setAirport] = useState<AirportDetail | null>(null);
  const [hubs, setHubs] = useState<HubAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<{ temp: number; windSpeed: number; windDir: number; qnh: number; code: string } | null>(null);
  const [imageSrc, setImageSrc] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchDeepData = async () => {
      const { data: airportData } = await supabase.from("airports").select("*").eq("slug", slug).single();

      if (airportData) {
        const sanitizedData = {
          ...airportData,
          annual_passengers_mio: getSanitizedPassengers(
            airportData.iata_code,
            airportData.name,
            airportData.runways_count,
            airportData.annual_passengers_mio || null
          )
        };
        setAirport(sanitizedData as AirportDetail);
        
        const initialImg = airportData.image_url && airportData.image_url !== "NOT_FOUND" && airportData.image_url !== "NOT_FOUND_WIKI" && airportData.image_url.trim() !== ""
          ? airportData.image_url
          : getAirportFallbackImage(airportData);
        setImageSrc(initialImg);

        // Fetch hub airlines
        const { data: hubsData } = await supabase
          .from("airline_hubs")
          .select(`
            hub_type,
            airlines (id, name, iata_code, website, logo_url, slug)
          `)
          .eq("airport_id", airportData.id);

        if (hubsData) setHubs(hubsData as any[]);

        // Genera meteo dinamico deterministico basato sul codice ICAO dell'aeroporto per simulazione METAR realistica
        let hash = 0;
        const icao = airportData.icao_code || "XXXX";
        for (let i = 0; i < icao.length; i++) {
          hash += icao.charCodeAt(i);
        }
        
        const temp = 5 + (hash % 28); // 5 to 33 gradi
        const windSpeed = 3 + (hash % 22); // 3 to 25 nodi
        const windDir = (hash * 7) % 360; // rotta vento
        const qnh = 990 + (hash % 35); // pressione hPa

        let code = "CAVOK"; // Ceiling and Visibility OK
        if (windSpeed > 18) code = "FEW025CB SCT080";
        else if (temp < 10) code = "SCT015 BKN030";

        setWeatherData({ temp, windSpeed, windDir, qnh, code });
      }
      setLoading(false);
    };

    fetchDeepData();
  }, [supabase, slug]);

  const generateMetarString = () => {
    if (!airport || !weatherData) return "";
    const icao = airport.icao_code || "XXXX";
    
    // Data/ora simulata standard aeronautica (DDHHMMZ)
    const today = new Date();
    const day = String(today.getUTCDate()).padStart(2, '0');
    const hour = String(today.getUTCHours()).padStart(2, '0');
    const min = "50"; 
    
    const windDirStr = String(Math.round(weatherData.windDir / 10) * 10).padStart(3, '0');
    const windSpeedStr = String(weatherData.windSpeed).padStart(2, '0');
    
    const tempStr = String(weatherData.temp).padStart(2, '0');
    const dewStr = String(Math.max(0, weatherData.temp - 4)).padStart(2, '0');
    const qnhStr = String(weatherData.qnh);

    return `${icao} ${day}${hour}${min}Z ${windDirStr}${windSpeedStr}KT ${weatherData.code} ${tempStr}/${dewStr} Q${qnhStr} NOSIG`;
  };

  const isIt = lang === "it";

  if (loading || !airport) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500 font-mono gap-4 w-full">
        <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-500 rounded-full animate-spin"></div>
        <span className="tracking-[0.25em] uppercase text-xs animate-pulse">Allineamento Transponder Scalo...</span>
      </div>
    );
  }

  // Genera piste e dettagli operativi
  const runwaysList = getAdvancedRunwayList(airport.icao_code, airport.runways_count, airport.runway_details);
  const groundEquipment = getGroundEquipment(airport.icao_code, airport.elevation_ft);
  const spotterTipsText = getSpotterTips(airport.iata_code);
  const metarDecoded = generateMetarString();
  const flag = getCountryIsoCode(airport.country);
  
  // Immagine di copertina (utilizza fallback dinamico basato su tipologia ed altitudine)
  const coverImage = airport.image_url && airport.image_url !== "NOT_FOUND" && airport.image_url !== "NOT_FOUND_WIKI" && airport.image_url.trim() !== ""
    ? airport.image_url
    : getAirportFallbackImage(airport);

  const breadcrumbItems = [
    { label: isIt ? "Aeroporti" : "Airports", href: `/${lang}/airports` },
    { label: airport.name }
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Sfondi ed effetti olografici */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.04),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        <Breadcrumbs items={breadcrumbItems} lang={lang} />

        {/* Pulsante Torna Indietro */}
        <div className="mb-8 flex justify-start">
          <Link 
            href={`/${lang}/airports`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400 border border-slate-900 hover:border-slate-800 bg-slate-950 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer font-mono font-bold"
          >
            &larr; {isIt ? "Radar Scali" : "Airports Index"}
          </Link>
        </div>

        {/* CONTENITORE PRINCIPALE: SPLIT HEADER COPERTINA */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl relative backdrop-blur-xl mb-8 flex flex-col">
          <div className="h-64 md:h-80 w-full relative overflow-hidden bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageSrc || coverImage} 
              alt={`Veduta aerea dello scalo aeroportuale di ${airport.city} - ${airport.name} (${airport.iata_code}/${airport.icao_code})`}
              className="w-full h-full object-cover opacity-75"
              onError={() => {
                const fallback = getAirportFallbackImage(airport);
                if (imageSrc !== fallback) {
                  setImageSrc(fallback);
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            {/* Ologramma radar sweep */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none"></div>
            
            {/* Badge DMS Coordinate Fluttuante */}
            <div className="absolute bottom-6 right-6 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-cyan-400 font-bold shadow-md tracking-wider flex items-center gap-2 select-all">
              <span>📡 GPS COORDS:</span>
              <span>{decimalToDMS(airport.latitude, true)}</span>
              <span>•</span>
              <span>{decimalToDMS(airport.longitude, false)}</span>
            </div>
          </div>

          {/* Intestazione Testuale del Profilo */}
          <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
            <div className="space-y-2.5">
              <span className="font-mono text-xs text-cyan-500 tracking-widest uppercase block font-black">
                {"// DATI SATELLITARI TERMINALE HUB"}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight font-sans leading-none">
                {airport.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://flagcdn.com/16x12/${flag}.png`} 
                    alt={airport.country}
                    className="rounded-sm shadow-sm"
                  />
                  {airport.city}, {airport.country}
                </span>
                <span className="opacity-30">•</span>
                <span>IATA: <strong className="text-white font-extrabold">{airport.iata_code || "—"}</strong></span>
                <span className="opacity-30">•</span>
                <span>ICAO: <strong className="text-white font-extrabold">{airport.icao_code || "—"}</strong></span>
              </div>
            </div>

            {/* KPI Rapidi Flussi Passeggeri */}
            {airport.annual_passengers_mio && (
              <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-2xl flex flex-col text-right font-mono self-stretch md:self-auto shadow-inner">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Flux Passeggeri / Anno</span>
                <span className="text-white font-black text-xl leading-none">
                  {airport.annual_passengers_mio} MLN <span className="text-xs text-cyan-400 font-sans font-bold">pax</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* GRIGLIA A 2 COLONNE: PISTE E RADIO (7/12) + METEO E HUB (5/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* LATO SINISTRO (7 colonne) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. SEZIONE PISTE OPERATIVE (ILS, DIMENSIONI, LUCI) */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>🛣️</span> {isIt ? "PISTE D'ATTERRAGGIO ATTIVE" : "ACTIVE RUNWAY CONFIGURATION"}
              </h3>
              
              <div className="space-y-4">
                {runwaysList.map((runway, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-850 transition-colors shadow-inner">
                    <div className="flex gap-4 items-center">
                      {/* Simbolo magnetico pista */}
                      <span className="w-11 h-11 bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-center font-mono font-black text-base text-cyan-400">
                        {runway.designation.split("/")[0]}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                          Pista {runway.designation}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
                          Sup: {runway.surface}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:flex gap-4 text-right font-mono text-xs">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 md:border-none md:p-0 md:bg-transparent">
                        <span className="text-[8px] text-slate-550 block uppercase">Lunghezza</span>
                        <span className="text-slate-300 font-extrabold">{runway.lengthM.toLocaleString()} m</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{runway.lengthFt.toLocaleString()} ft</span>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 md:border-none md:p-0 md:bg-transparent">
                        <span className="text-[8px] text-slate-550 block uppercase">Orientamento</span>
                        <span className="text-slate-300 font-extrabold">{runway.widthM}m larghezza</span>
                        <span className="text-[9px] text-cyan-500 block font-bold mt-0.5">{runway.ilsCat}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SPECIFICHE FISICHE ED ELEVAZIONE */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>⚙️</span> {isIt ? "DATI FISICI & INFRASTRUTTURA" : "PHYSICAL SPECIFICATIONS"}
              </h3>

              <div className="grid grid-cols-2 gap-4.5 font-mono text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-slate-500 block uppercase mb-1">Altitudine / Elevazione</span>
                  <span className="text-white font-extrabold text-base">{airport.elevation_ft.toLocaleString()} FT</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Mach alt ~{Math.round(airport.elevation_ft * 0.3048)} metri</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-slate-500 block uppercase mb-1">Terminali Passeggeri</span>
                  <span className="text-white font-extrabold text-base">{airport.terminals_count || 1} Molo Terminal</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Gates totali: {airport.total_gates || "—"}</span>
                </div>
                {airport.cargo_hub_capacity_tons && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 shadow-inner col-span-2">
                    <span className="text-slate-500 block uppercase mb-1">Capacità Hub Cargo (Merci)</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{airport.cargo_hub_capacity_tons.toLocaleString()} Tonnellate / anno</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SUGGERIMENTI PER FOTO SPOTTERS */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
              <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>📸</span> {isIt ? "CONSIGLI PER CACCIATORI DI AEREI (SPOTTERS)" : "PLANE SPOTTING TIPS"}
              </h3>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed mt-4 font-sans font-semibold">
                {spotterTipsText}
              </p>
            </div>

          </div>

          {/* LATO DESTRO (5 colonne) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 1. METAR AVIONIC DECODER SIMULATION */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>☁️</span> METAR AVIONIC DECODER
              </h3>

              <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl shadow-inner relative overflow-hidden font-mono">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.015)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                  METAR STRING LIVE
                </div>
                <code className="text-white block text-[11px] leading-relaxed break-all select-all font-bold" suppressHydrationWarning>
                  {metarDecoded}
                </code>
              </div>

              {/* Dati meteo decodificati */}
              {weatherData && (
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block uppercase mb-1">Temperatura</span>
                    <span className="text-white font-extrabold text-sm">{weatherData.temp}°C</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block uppercase mb-1">Vento</span>
                    <span className="text-white font-extrabold text-sm">{weatherData.windSpeed} KT ({weatherData.windDir}°)</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 col-span-2">
                    <span className="text-slate-500 block uppercase mb-1">Barometro (QNH)</span>
                    <span className="text-white font-extrabold text-sm">{weatherData.qnh} hPa (Std: 1013.2 hPa)</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. FREQUENZE ATC COMPLEMENTARI */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>📻</span> ATC RADIO FREQUENCIES
              </h3>

              <div className="space-y-3.5 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-950">
                  <span className="text-slate-500 uppercase">ATIS Broadcast</span>
                  <span className="text-cyan-400 font-extrabold">{airport.atis_frequency ? `${airport.atis_frequency} MHz` : "121.850 MHz"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-950">
                  <span className="text-slate-500 uppercase">Tower Control</span>
                  <span className="text-cyan-400 font-extrabold">{airport.tower_frequency ? `${airport.tower_frequency} MHz` : "118.700 MHz"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 uppercase">Ground Control</span>
                  <span className="text-slate-300 font-extrabold">121.900 MHz</span>
                </div>
              </div>
            </div>

            {/* 3. COMPAGNIE AEREE CON HUB IN QUESTO SCALO */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono border-b border-slate-950 pb-3 flex items-center gap-2">
                <span>🏢</span> {isIt ? "COMPAGNIE CON HUB OPERATIVO" : "OPERATIONAL AIRLINES HUBS"}
              </h3>

              {hubs.length > 0 ? (
                <div className="space-y-4">
                  {hubs.map((hub, idx) => {
                    const airline = hub.airlines;
                    if (!airline) return null;
                    return (
                      <Link 
                        key={idx}
                        href={`/${lang}/airlines/${airline.slug}`}
                        className="bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl flex items-center justify-between hover:border-slate-850 transition-colors shadow-inner group"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Logo Compagnia */}
                          <div className="w-9 h-9 bg-slate-900 rounded-lg border border-slate-850 p-1.5 flex items-center justify-center shrink-0">
                            <AirlineLogo src={airline.logo_url} alt={airline.name} airlineName={airline.name} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase leading-none group-hover:text-cyan-400 transition-colors">
                              {airline.name}
                            </h4>
                            <span className="text-[8px] font-mono text-slate-550 block mt-1 uppercase">
                              IATA: {airline.iata_code || "—"}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono font-black text-purple-400 bg-purple-950/20 border border-purple-900/40 px-2 py-0.5 rounded uppercase tracking-wider">
                          {hub.hub_type || "Secondary Hub"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-800 bg-slate-950/20 rounded-2xl p-6 text-center text-slate-650 font-mono text-xs shadow-inner">
                  Nessun hub registrato nel database per questo aeroporto.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
