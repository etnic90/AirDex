import { supabase } from "@/lib/supabase";
import { AircraftModel } from "@/types"; 
import { notFound } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import Link from "next/link";
// Importiamo il nuovo componente schermato contro i crash
import AirlineLogo from "@/components/AirlineLogo";
import SpotterSection from "@/components/SpotterSection";
import CaptureButtons from "@/components/CaptureButtons";
import Breadcrumbs from "@/components/Breadcrumbs";
import AircraftHeroImage from "@/components/AircraftHeroImage";

const getCountryCode = (countryName?: string): string | null => {
  if (!countryName) return null;
  const name = countryName.toLowerCase().trim();
  if (name.includes("ital")) return "it";
  if (name.includes("united states") || name.includes("usa") || name.includes("stati uniti")) return "us";
  if (name.includes("united kingdom") || name.includes("uk") || name.includes("regno unito")) return "gb";
  if (name.includes("france") || name.includes("francia")) return "fr";
  if (name.includes("germany") || name.includes("germania")) return "de";
  if (name.includes("spain") || name.includes("spagna")) return "es";
  if (name.includes("japan") || name.includes("giappone")) return "jp";
  if (name.includes("china") || name.includes("cina")) return "cn";
  if (name.includes("canada")) return "ca";
  if (name.includes("australia")) return "au";
  if (name.includes("brazil") || name.includes("brasile")) return "br";
  if (name.includes("netherlands") || name.includes("olanda") || name.includes("paesi bassi")) return "nl";
  if (name.includes("switzerland") || name.includes("svizzera")) return "ch";
  if (name.includes("turkey") || name.includes("turchia")) return "tr";
  if (name.includes("united arab emirates") || name.includes("emirati arabi")) return "ae";
  if (name.includes("qatar")) return "qa";
  if (name.includes("ireland") || name.includes("irlanda")) return "ie";
  if (name.includes("singapore")) return "sg";
  if (name.includes("saudi arabia") || name.includes("arabia saudita") || name.includes("saudia")) return "sa";
  if (name.includes("hong kong")) return "hk";
  return null;
};

/**
 * 1. SEO - GENERATE METADATA
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string, slug: string }> 
}): Promise<Metadata> {
  const { lang, slug } = await params;
  
  const { data: aircraft } = await supabase
    .from('aircraft_models')
    .select('model_name, manufacturers(name)')
    .eq('slug', slug)
    .single();

  if (!aircraft) {
    return { title: "Aircraft Not Found | AirDex" };
  }

  const aircraftName = aircraft.model_name;
  const manufacturerObj = Array.isArray(aircraft.manufacturers) ? aircraft.manufacturers[0] : aircraft.manufacturers;
  const manufacturer = (manufacturerObj as unknown as { name: string } | null)?.name || 'Aviation';

  const isIt = lang === "it";
  const isEs = lang === "es";
  const isFr = lang === "fr";
  const isDe = lang === "de";

  let title = `${aircraftName} | ${manufacturer} | AirDex Hangar`;
  let description = `Technical specifications, history, and details of the ${aircraftName}. Discover all the data in the AirDex Aviation Hangar.`;

  if (isIt) {
    title = `${aircraftName} | ${manufacturer} | Hangar AirDex`;
    description = `Specifiche tecniche, storia e dettagli del ${aircraftName}. Scopri tutti i dati nell'hangar dell'aviazione di AirDex.`;
  } else if (isEs) {
    title = `${aircraftName} | ${manufacturer} | Hangar AirDex`;
    description = `Especificaciones técnicas, historia y detalles del ${aircraftName}. Descubre todos los datos en el hangar de aviación de AirDex.`;
  } else if (isFr) {
    title = `${aircraftName} | ${manufacturer} | Hangar AirDex`;
    description = `Spécifications techniques, histoire et détails du ${aircraftName}. Découvrez toutes les données dans le hangar d'aviation d'AirDex.`;
  } else if (isDe) {
    title = `${aircraftName} | ${manufacturer} | AirDex Hangar`;
    description = `Technische Spezifikationen, Geschichte und Details der ${aircraftName}. Entdecken Sie alle Daten im AirDex Luftfahrthangar.`;
  }

  return {
    title,
    description,
    openGraph: {
      title: `${aircraftName} - Technical Data`,
      description: description,
    }
  };
}

/**
 * 2. PROGRAMMATIC SEO - GENERATE STATIC PARAMS
 */
export async function generateStaticParams() {
  const { data: aircrafts } = await supabase
    .from('aircraft_models')
    .select('slug');

  if (!aircrafts) return [];

  const locales = ['en', 'it', 'es', 'fr', 'de'];
  
  return aircrafts.flatMap((aircraft) =>
    locales.map((lang) => ({
      lang: lang,
      slug: aircraft.slug,
    }))
  );
}

// Caching for linkable entities to avoid redundant database queries during static generation
let cachedLinkableData: {
  planes: { id: string; model_name: string; slug: string }[];
  airlines: { id: string; name: string; iata_code: string | null; slug: string }[];
  airports: { id: string; name: string; iata_code: string | null; slug: string }[];
} | null = null;

async function getLinkableData() {
  if (cachedLinkableData) return cachedLinkableData;
  
  const [planesRes, airlinesRes, airportsRes] = await Promise.all([
    supabase.from('aircraft_models').select('id, model_name, slug'),
    supabase.from('airlines').select('id, name, iata_code, slug'),
    supabase.from('airports').select('id, name, iata_code, slug')
  ]);
  
  cachedLinkableData = {
    planes: planesRes.data || [],
    airlines: airlinesRes.data || [],
    airports: airportsRes.data || []
  };
  
  return cachedLinkableData;
}

/**
 * 3. PAGE COMPONENT
 */
export default async function AircraftPage({ 
  params 
}: { 
  params: Promise<{ lang: string, slug: string }> 
}) {
  const { lang, slug } = await params;

  // Abilita il rendering statico per next-intl
  setRequestLocale(lang);

  // Recupera i dati linkabili della flotta/aerei/aeroporti
  const linkableData = await getLinkableData();

  // Query 1: Modello + Costruttore
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*, manufacturers(*)') 
    .eq('slug', slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const aircraft = data as unknown as AircraftModel;
  const localizedDescription = aircraft[`description_${lang}` as keyof typeof aircraft] || aircraft.description;

  // Query 2: Join Compagnie per Navigazione Circolare
  const { data: fleetData } = await supabase
    .from('airline_fleet')
    .select(`
      qty,
      status,
      airlines ( id, name, iata_code, website, logo_url, country, slug )
    `)
    .eq('aircraft_model_id', data.id);

  interface OperatorItem {
    qty: number;
    status: string;
    airlines: {
      id: string;
      name: string;
      iata_code: string | null;
      website: string | null;
      logo_url: string | null;
      country: string | null;
      slug: string;
    } | null;
  }

  const operators = (fleetData || []) as unknown as OperatorItem[];
  const activeOperators = operators.filter(op => op.status === 'ACTIVE');
  const historicOperators = operators.filter(op => op.status === 'HISTORIC');

  // Query 3: Foto Spotter Approvate
  const { data: spotterData } = await supabase
    .from('spotter_uploads')
    .select(`
      id,
      photographer_name,
      image_url,
      registration_number,
      notes,
      created_at,
      airlines ( name ),
      airports ( name, iata_code )
    `)
    .eq('aircraft_id', data.id)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  interface SpotterPhotoItem {
    id: string;
    photographer_name: string;
    image_url: string;
    registration_number: string | null;
    notes: string | null;
    created_at: string;
    airlines: { name: string } | null;
    airports: { name: string; iata_code: string } | null;
  }

  const initialPhotos = (spotterData || []) as unknown as SpotterPhotoItem[];

  // Query 4: Lista Compagnie per Dropdown (con paginazione per superare il limite di 1000)
  let airlinesList: { id: string; name: string }[] = [];
  let startAirlines = 0;
  const sizeAirlines = 1000;
  while (true) {
    const { data: chunk, error: err } = await supabase
      .from('airlines')
      .select('id, name')
      .order('name')
      .range(startAirlines, startAirlines + sizeAirlines - 1);
      
    if (err) {
      console.error("Errore recupero dropdown compagnie:", err.message);
      break;
    }
    if (chunk) {
      airlinesList = airlinesList.concat(chunk);
      if (chunk.length < sizeAirlines) break;
    } else {
      break;
    }
    startAirlines += sizeAirlines;
  }

  // Query 5: Lista Aeroporti per Dropdown
  const { data: airportsList } = await supabase
    .from('airports')
    .select('id, name, iata_code')
    .order('name');

  // Strategia Immagini: Fallback gerarchico
  const imageUrl = aircraft.house_livery_url || aircraft.launch_customer_livery_url;

  // Status Badge Colors
  const isHistoric = aircraft.status === 'HISTORIC';
  const statusColor = isHistoric 
    ? 'text-amber-500/80 border-amber-900/50 bg-amber-950/30' 
    : 'text-emerald-500/80 border-emerald-900/50 bg-emerald-950/30';

  // Rarity Colors (Sci-Fi Hologram)
  const rarityColors: Record<string, string> = {
    COMMON: 'text-slate-300 border-slate-500 bg-slate-900/50 shadow-[0_0_15px_rgba(148,163,184,0.2)]',
    UNCOMMON: 'text-green-400 border-green-700 bg-green-950/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    RARE: 'text-blue-400 border-blue-700 bg-blue-950/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    EPIC: 'text-purple-400 border-purple-700 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    LEGENDARY: 'text-amber-400 border-amber-700 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  };
  
  const rarityStyle = aircraft.rarity && rarityColors[aircraft.rarity] 
    ? rarityColors[aircraft.rarity] 
    : 'text-cyan-400 border-cyan-700 bg-cyan-950/30';

  const ext = aircraft.extended_stats as Record<string, any> | undefined;
  const cruiseSpeed = ext?.cruise_speed_kmh || (aircraft.first_flight_year && aircraft.first_flight_year < 1960 ? 450 : 880);
  const maxAltitude = ext?.max_altitude_m || (aircraft.first_flight_year && aircraft.first_flight_year < 1960 ? 7000 : 12500);
  const engineThrust = ext?.engine_thrust_kn;
  const trivia = ext?.[`trivia_${lang}`] || (Array.isArray(aircraft.trivia) ? aircraft.trivia : []);

  const getSectionHeader = (index: number) => {
    switch (index) {
      case 0: return "Contesto Storico & Origini";
      case 1: return "Architettura & Design Tecnologico";
      case 2: return "Carriera Operativa & Vettori";
      case 3: return "Eredità & Impatto Culturale";
      default: return "Note Addizionali & Analisi";
    }
  };

  const findMatchingLink = (val: string): string | null => {
    const cleanVal = val.trim().toLowerCase();
    if (!cleanVal || cleanVal.length < 2) return null;

    // Evita link all'aereo corrente stesso
    if (cleanVal.includes(aircraft.model_name.toLowerCase()) || aircraft.model_name.toLowerCase().includes(cleanVal)) {
      return null;
    }

    // 1. Mappature speciali per modelli famosi o sigle corte
    if (cleanVal.includes("747")) {
      const match = linkableData.planes.find(p => p.model_name.includes("747-400"));
      if (match) return `/${lang}/aircraft/${match.slug}`;
    }
    if (cleanVal.includes("dc-10") || cleanVal.includes("dc10")) {
      const match = linkableData.planes.find(p => p.model_name.includes("DC-10-30"));
      if (match) return `/${lang}/aircraft/${match.slug}`;
    }
    if (cleanVal.includes("tristar") || cleanVal.includes("l-1011-1") || (cleanVal.includes("l-1011") && !cleanVal.includes("-100"))) {
      const match = linkableData.planes.find(p => p.model_name.includes("L-1011-1"));
      if (match) return `/${lang}/aircraft/${match.slug}`;
    }

    // 2. Controllo aerei esatti
    for (const plane of linkableData.planes) {
      const pName = plane.model_name.toLowerCase();
      if (cleanVal === pName || (cleanVal.length > 5 && pName.includes(cleanVal)) || (pName.length > 5 && cleanVal.includes(pName))) {
        return `/${lang}/aircraft/${plane.slug}`;
      }
    }

    // 3. Controllo compagnie aeree
    for (const airline of linkableData.airlines) {
      const aName = airline.name.toLowerCase();
      const aIata = airline.iata_code?.toLowerCase();
      
      if (
        cleanVal === aName || 
        (aIata && cleanVal === aIata) ||
        (cleanVal === "twa" && aName.includes("twa")) ||
        (cleanVal.length > 4 && aName.includes(cleanVal)) ||
        (aName.length > 4 && cleanVal.includes(aName))
      ) {
        return `/${lang}/airlines/${airline.slug}`;
      }
    }

    // 4. Controllo aeroporti
    for (const airport of linkableData.airports) {
      const apName = airport.name.toLowerCase();
      const apIata = airport.iata_code?.toLowerCase();
      
      if (
        cleanVal === apName || 
        (apIata && cleanVal === apIata) ||
        (cleanVal.length > 5 && apName.includes(cleanVal)) ||
        (apName.length > 5 && cleanVal.includes(apName))
      ) {
        return `/${lang}/airports/${airport.slug}`;
      }
    }

    return null;
  };

  const parseInlineFormatting = (text: string) => {
    // Supporto base per i grassetti inline **testo** con link automatici
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
              className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline transition-colors underline-offset-4 decoration-cyan-500/50"
            >
              {cleanVal}
            </Link>
          );
        }
        return <strong key={idx} className="text-cyan-200 font-extrabold">{cleanVal}</strong>;
      }
      return part;
    });
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    // Dividiamo in blocchi in base alle sezioni contrassegnate con ### (solo all'inizio di una riga, per evitare di dividere sub-heading ####)
    const sections = text.split(/(?=(?<=^|\n)###(?![#])\s+)/);
    
    return sections.map((section, sIdx) => {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return null;
      
      let title = "";
      const contentNodes: React.ReactNode[] = [];
      
      let startIdx = 0;
      if (lines[0].startsWith("###")) {
        title = lines[0].replace(/^###\s+/, "").trim();
        startIdx = 1;
      } else {
        // Se non c'è un titolo ### per questo blocco, usiamo un titolo predefinito basato sull'indice
        title = getSectionHeader(sIdx);
      }
      
      let inList = false;
      let listItems: string[] = [];
      
      const flushList = (key: string) => {
        if (listItems.length > 0) {
          contentNodes.push(
            <ul key={key} className="space-y-3 my-5 pl-1.5 text-left">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-slate-300 font-sans text-sm md:text-[16px] leading-relaxed group/li">
                  <span className="text-cyan-500 mt-2 shrink-0 select-none text-[8px] leading-none transition-transform duration-300 group-hover/li:translate-x-1">
                    ◆
                  </span>
                  <span className="flex-1 text-slate-300">
                    {parseInlineFormatting(item)}
                  </span>
                </li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
      };
      
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        
        // Controllo se è un punto elenco
        if (line.startsWith("*") || line.startsWith("-") || line.startsWith("•")) {
          if (!inList) {
            inList = true;
          }
          listItems.push(line.replace(/^[\*\-\•]\s*/, ""));
        } else {
          // Se eravamo in una lista, svuotiamo la lista prima di procedere con un paragrafo
          flushList(`list-${sIdx}-${i}`);
          
          // Controllo se è un box di Curiosità/Trivia/Aneddoto
          const isCuriosity = 
            line.startsWith("**Curiosità") || 
            line.startsWith("**Aneddoto") || 
            line.startsWith("**Curiosità:**") || 
            line.startsWith("Curiosità:") || 
            line.startsWith("**Nota:**");
            
          // Controllo se è un sottotitolo all'interno della sezione (es. **Titolo**:)
          const isSubheading = 
            line.startsWith("####") ||
            (line.startsWith("**") && (line.endsWith("**") || line.endsWith(":**") || line.endsWith(":") || line.endsWith("**:") || line.endsWith("**.")) && line.length < 120);

          if (isCuriosity) {
            const cleanText = line
              .replace(/^\*\*Curiosità\*\*:\s*/i, "")
              .replace(/^\*\*Curiosità:\*\*\s*/i, "")
              .replace(/^Curiosità:\s*/i, "")
              .replace(/^\*\*Aneddoto\*\*:\s*/i, "")
              .replace(/^\*\*Nota:\*\*\s*/i, "")
              .replace(/^\*\*+/g, "")
              .replace(/\*\*+$/g, "")
              .replace(/:$/, "")
              .trim();
              
            contentNodes.push(
              <div 
                key={`curiosity-${sIdx}-${i}`} 
                className="bg-amber-950/20 border border-amber-900/40 hover:border-amber-500/30 rounded-2xl p-5 md:p-6 my-6 flex items-start gap-4 shadow-lg backdrop-blur-sm relative overflow-hidden group transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-amber-500 to-yellow-600" />
                <span className="text-amber-500 text-2xl mt-0.5 shrink-0 animate-pulse select-none">
                  💡
                </span>
                <div className="flex-1 text-left">
                  <h5 className="text-amber-500 font-mono text-sm uppercase tracking-[0.2em] font-bold mb-1.5 flex items-center gap-1.5">
                    Curiosità / Hangar Trivia
                  </h5>
                  <p className="text-amber-100/95 text-[14px] md:text-[15px] leading-relaxed font-sans">
                    {parseInlineFormatting(cleanText)}
                  </p>
                </div>
              </div>
            );
          } else if (isSubheading) {
            const cleanSubheading = line
              .replace(/^#+\s+/, "")
              .replace(/^\*\*+/, "")
              .replace(/\*\*+$/, "")
              .replace(/\*\*+:$/, "")
              .replace(/:$/, "")
              .trim();

            contentNodes.push(
              <h3 key={`sub-${sIdx}-${i}`} className="font-bold text-cyan-400 text-base md:text-lg mt-8 mb-4 tracking-wide font-sans text-left flex items-center gap-2.5">
                <span className="w-1 h-5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                {cleanSubheading}
              </h3>
            );
          } else {
            // Paragrafo normale
            contentNodes.push(
              <p key={`p-${sIdx}-${i}`} className="text-slate-300 text-[16px] md:text-[17px] leading-relaxed text-left whitespace-pre-wrap mb-5 font-sans">
                {parseInlineFormatting(line)}
              </p>
            );
          }
        }
      }
      
      // Svuotiamo eventuali liste residue al termine del blocco
      flushList(`list-end-${sIdx}`);
      
      return (
        <div 
          key={sIdx}
          className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-md transition-all duration-500 relative overflow-hidden group text-left shadow-xl hover:shadow-[0_0_35px_rgba(6,182,212,0.12)]"
        >
          <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-cyan-500 to-blue-600 opacity-25 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {/* Cyberpunk corner bracket element */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-800/60 group-hover:border-cyan-500/40 transition-colors duration-500 pointer-events-none rounded-tr-2xl" />
          
          <div className="flex flex-col gap-1 mb-6 pb-4 border-b border-slate-800/60">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wider font-sans mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-350">
              {title}
            </h2>
          </div>
          
          <div className="mt-4">
            {contentNodes}
          </div>
        </div>
      );
    });
  };
  const isIt = lang === "it";
  const breadcrumbItems = [
    { label: isIt ? "Catalogo" : "Catalogue", href: `/${lang}/radar` },
    { label: aircraft.model_name }
  ];

  const aircraftJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": aircraft.model_name,
    "image": imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `https://www.airdex.org${imageUrl}`) : undefined,
    "description": localizedDescription || `Technical specifications and historical details of the ${aircraft.model_name}.`,
    "brand": {
      "@type": "Brand",
      "name": aircraft.manufacturers?.name || "Aviation"
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Operating Range",
        "value": `${aircraft.range_km} km`
      },
      {
        "@type": "PropertyValue",
        "name": "Passenger Capacity",
        "value": aircraft.max_passengers
      },
      {
        "@type": "PropertyValue",
        "name": "First Flight Year",
        "value": aircraft.first_flight_year
      },
      {
        "@type": "PropertyValue",
        "name": "Status",
        "value": aircraft.status
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aircraftJsonLd) }}
      />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 text-slate-100 relative font-sans">
        {/* Sfondo cockpit/radar globale */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-25 fixed">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        <div className="max-w-[1600px] w-[95%] mx-auto px-4 md:px-10 relative z-10">
          
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          
          {/* HEADER PRINCIPALE DELL'AEREO */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4 border-b border-slate-900 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">{aircraft.model_name}</h1>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-lg font-mono">
              {aircraft.manufacturers?.name || 'Costruttore Sconosciuto'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Rarity Badge */}
            {aircraft.rarity && (
              <span className={`text-sm font-black px-3.5 py-2 rounded uppercase tracking-widest border font-mono ${rarityStyle}`}>
                {aircraft.rarity}
              </span>
            )}
            
            {/* Era Badge */}
            {aircraft.era && (
              <span className="text-sm font-black px-3.5 py-2 rounded uppercase tracking-widest border border-indigo-500/50 bg-indigo-950/30 text-indigo-400 font-mono">
                {aircraft.era.replace(/_/g, ' ')}
              </span>
            )}

            <span className="text-sm font-black px-3.5 py-2 rounded uppercase tracking-widest border bg-slate-900 border-slate-800 text-slate-300 font-mono">
              {aircraft.type || 'N/A'}
            </span>
            
            {aircraft.status && (
              <span className={`text-sm font-black px-3.5 py-2 rounded uppercase tracking-widest border font-mono ${statusColor}`}>
                {aircraft.status}
              </span>
            )}
          </div>
        </div>

        {/* CONTENITORE GRID A DUE COLONNE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNA SINISTRA (8 colonne): Immagine, Descrizione Storica e Operatori */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Immagine Hero dell'aereo */}
            <div className="w-full h-64 md:h-[450px] bg-cyan-950/10 rounded-2xl flex flex-col items-center justify-center border border-cyan-900/30 relative overflow-hidden shadow-[inset_0_0_40px_rgba(6,182,212,0.08)] group">
              {imageUrl ? (
                <>
                  <AircraftHeroImage 
                    src={imageUrl} 
                    alt={`Foto schema e livrea ufficiale del modello di aereo ${aircraft.manufacturers?.name || 'Aviation'} ${aircraft.model_name}`}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500 z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20 pointer-events-none" />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-cyan-800 mb-4 animate-pulse z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-cyan-500 font-mono text-sm font-bold tracking-[0.2em] bg-slate-900/60 px-4 py-1.5 rounded border border-cyan-900/40 z-10">
                    SISTEMA ACQUISIZIONE IMMAGINE OFFLINE
                  </span>
                </div>
              )}
            </div>

            {/* SEZIONI CRONACHE & STORIA IN PARAGRAFI */}
            {localizedDescription ? (
              <div className="space-y-6">
                {renderFormattedText(localizedDescription as string)}
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-8 text-center text-slate-500 font-mono text-xs">
                Nessuna cronologia storica inserita per questo modello.
              </div>
            )}

          </div>

          {/* COLONNA DESTRA (4 colonne): Telemetria, Curiosità, Sponsors */}
          <div className="lg:col-span-4 space-y-8">
            
            <div className="w-full">
              <CaptureButtons targetId={aircraft.id} type="AIRCRAFT" lang={lang} />
            </div>

            {/* PANNELLO TELEMETRIA HUD */}
            <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl hover:border-cyan-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-full blur-xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-cyan-500 to-blue-600 opacity-40" />
              
              <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-2.5 font-bold pb-3 border-b border-slate-800/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Telemetria Specs (HUD)
              </h3>

              <div className="space-y-3.5 font-mono text-sm text-left">
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Costruttore</span>
                  <span className="text-white font-bold font-sans text-right text-base">{aircraft.manufacturers?.name || 'Aviation'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Primo Volo</span>
                  <span className="text-cyan-400 font-bold text-base">{aircraft.first_flight_year || 'N/A'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Stato Operativo</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded text-sm ${aircraft.status === 'ACTIVE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950/40 text-amber-500 border border-amber-900/30'}`}>
                    {aircraft.status}
                  </span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Velocità Crociera</span>
                  <span className="text-cyan-300 font-bold text-base">{cruiseSpeed ? `${cruiseSpeed.toLocaleString()} km/h` : 'N/A'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Quota Tangenziale</span>
                  <span className="text-cyan-300 font-bold text-base">{maxAltitude ? `${maxAltitude.toLocaleString()} m` : 'N/A'}</span>
                </div>
                {engineThrust && (
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                    <span className="text-slate-500 uppercase tracking-wider text-sm">Spinta Motori</span>
                    <span className="text-cyan-300 font-bold text-base">{engineThrust} kN</span>
                  </div>
                )}
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Autonomia</span>
                  <span className="text-cyan-300 font-bold text-base">{aircraft.range_km ? `${aircraft.range_km.toLocaleString()} km` : 'N/A'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Capienza Max</span>
                  <span className="text-cyan-300 font-bold text-base">{aircraft.max_passengers ? `${aircraft.max_passengers} PAX` : 'N/A'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-900 flex flex-col gap-1.5 items-start hover:border-slate-800/80 transition-colors">
                  <span className="text-slate-500 uppercase tracking-wider text-sm">Motori Installati</span>
                  <span className="text-slate-300 font-bold font-sans text-sm text-left leading-relaxed">{aircraft.engines || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* DOCK CURIOSITÀ / TRIVIA */}
            {trivia.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl hover:border-amber-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/2 rounded-full blur-xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-amber-500 to-yellow-600 opacity-40" />
                
                <h3 className="text-amber-400 font-mono text-sm uppercase tracking-[0.25em] mb-5 flex items-center gap-2.5 font-bold pb-3 border-b border-slate-800/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Hangar Trivia & Curiosità
                </h3>
                <ul className="space-y-3.5 font-sans text-sm text-slate-300 text-left">
                  {trivia.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-3.5 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900/80 hover:border-slate-800 transition-all duration-300 hover:bg-slate-900/20 group/trivia">
                      <span className="text-amber-500 font-bold shrink-0 select-none text-[15px] transition-transform duration-300 group-hover/trivia:scale-125">💡</span>
                      <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>

        {/* SEZIONE SPOTTER CARICAMENTI E GALLERIA (100% Width) */}
        <div className="w-full border-t border-slate-900 mt-14 pt-10">
          <SpotterSection
            aircraftId={aircraft.id}
            lang={lang}
            initialPhotos={initialPhotos}
            airlinesList={airlinesList || []}
            airportsList={airportsList || []}
          />
        </div>

        {/* SEZIONE COMPLETA VETTORI (100% Width) */}
        {(activeOperators.length > 0 || historicOperators.length > 0) && (
          <div className="w-full border-t border-slate-900 mt-14 pt-10 space-y-10">
            
            {/* VETTORI ATTIVI */}
            {activeOperators.length > 0 && (
              <div>
                <h3 className="text-purple-400 font-mono text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-3 font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Vettori Rilevati (Flotta Attiva)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {activeOperators.map((item, idx) => {
                    const airline = item.airlines;
                    if (!airline) return null;

                    const logoSrc = airline.logo_url 
                      ? airline.logo_url 
                      : (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

                    const countryCode = airline.country ? getCountryCode(airline.country) : null;

                    return (
                      <Link 
                        key={`${airline.id}-${idx}`}
                        href={`/${lang}/airlines/${airline.slug}`}
                        className="bg-slate-900/20 border border-slate-800/80 hover:border-purple-500/40 p-5 rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-slate-900/40 group shadow-md hover:-translate-y-0.5 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-purple-500 transition-colors" />
                        <div className="w-24 h-14 rounded bg-white flex items-center justify-center p-1 border border-slate-800 shadow-sm shrink-0 overflow-hidden relative">
                          <AirlineLogo 
                            src={logoSrc} 
                            alt={airline.name} 
                            airlineName={airline.name} 
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-purple-400 font-mono uppercase tracking-wider font-bold">
                              CODE: {airline.iata_code || "—"}
                            </span>
                            {countryCode ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={`https://flagcdn.com/w40/${countryCode}.png`} 
                                alt={airline.country || ""} 
                                className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-800 shrink-0"
                              />
                            ) : (
                              airline.country && (
                                <span className="text-base select-none" title={airline.country}>🌐</span>
                              )
                            )}
                          </div>
                          <h4 className="text-white font-semibold text-sm group-hover:text-purple-400 transition-colors truncate font-sans mt-0.5">
                            {airline.name}
                          </h4>
                          <span className="text-slate-400 text-sm block mt-0.5 font-sans">
                            In Flotta: <strong className="text-slate-300 font-bold">x{item.qty} u.</strong>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VETTORI STORICI */}
            <div>
              <h3 className="text-slate-400 font-mono text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-3 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vettori Rilevati (Flotta Storica / Dismessa)
              </h3>
              
              {historicOperators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {historicOperators.map((item, idx) => {
                    const airline = item.airlines;
                    if (!airline) return null;

                    const logoSrc = airline.logo_url 
                      ? airline.logo_url 
                      : (airline.website ? `https://logo.clearbit.com/${airline.website}` : null);

                    const countryCode = airline.country ? getCountryCode(airline.country) : null;

                    return (
                      <Link 
                        key={`${airline.id}-${idx}`}
                        href={`/${lang}/airlines/${airline.slug}`}
                        className="bg-slate-900/10 border border-slate-900 hover:border-slate-700/60 p-5 rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-slate-900/20 group shadow-md hover:-translate-y-0.5 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-slate-500 transition-colors" />
                        <div className="w-24 h-14 rounded bg-white flex items-center justify-center p-1 border border-slate-800 shadow-sm shrink-0 overflow-hidden relative">
                          <AirlineLogo 
                            src={logoSrc} 
                            alt={airline.name} 
                            airlineName={airline.name} 
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-slate-500 font-mono uppercase tracking-wider font-bold">
                              CODE: {airline.iata_code || "—"}
                            </span>
                            {countryCode ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={`https://flagcdn.com/w40/${countryCode}.png`} 
                                alt={airline.country || ""} 
                                className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-800 shrink-0"
                              />
                            ) : (
                              airline.country && (
                                <span className="text-base select-none" title={airline.country}>🌐</span>
                              )
                            )}
                          </div>
                          <h4 className="text-slate-300 font-semibold text-sm group-hover:text-slate-400 transition-colors truncate font-sans mt-0.5">
                            {airline.name}
                          </h4>
                          <span className="text-slate-500 text-sm block mt-0.5 font-sans">
                            Stato: <strong className="text-slate-400 font-bold">Dismesso</strong>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-900/40 bg-slate-950/5 rounded-xl p-8 text-center text-slate-500 font-sans text-sm">
                  Nessun vettore storico registrato nel database per questo modello.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
    </>
  );
}