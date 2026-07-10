import { supabase } from "@/lib/supabase";
import AirlinesClient from "./AirlinesClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isIt = lang === "it";
  const isEs = lang === "es";
  const isFr = lang === "fr";
  const isDe = lang === "de";

  let title = "Airlines Directory | AirDex";
  let description = "Explore the civil aviation operators index. Analyze airline codes, alliances, strategic hubs, and fleet models.";

  if (isIt) {
    title = "Terminale Aerolinee | AirDex";
    description = "Esplora l'indice degli operatori aerei civili storici e attivi. Analizza codici, alleanze, hub strategici e flotta.";
  } else if (isEs) {
    title = "Directorio de Aerolíneas | AirDex";
    description = "Explore el índice de operadores de aviación civil. Analice códigos de aerolíneas, alianzas, centros de conexión y flotas.";
  } else if (isFr) {
    title = "Annuaire des Compagnies | AirDex";
    description = "Explorez l'index des opérateurs de l'aviation civile. Analysez les codes de compagnies, alliances, hubs et flottes.";
  } else if (isDe) {
    title = "Fluggesellschaften-Verzeichnis | AirDex";
    description = "Erkunden Sie das Verzeichnis der Betreiber der zivilen Luftfahrt. Analysieren Sie Codes, Allianzen, Hubs und Flotten.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/airlines`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/airlines`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Airlines Directory",
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://airdex.org/images/seo-banner.jpg"],
    }
  };
}

export async function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "it" },
    { lang: "es" },
    { lang: "fr" },
    { lang: "de" },
  ];
}

export default async function AirlinesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // PostgREST ha un limite fisso di 1000 righe per chiamata.
  // Selezioniamo solo le colonne richieste per ridurre il carico di banda del 90% ed evitare timeout sul server.
  const fields = "id, name, iata_code, icao_code, country, founded_year, closed_year, logo_url, alliance, main_hub, slogan, website, callsign, slug";
  const [chunk1, chunk2, chunk3, chunk4] = await Promise.all([
    supabase.from("airlines").select(fields).range(0, 999),
    supabase.from("airlines").select(fields).range(1000, 1999),
    supabase.from("airlines").select(fields).range(2000, 2999),
    supabase.from("airlines").select(fields).range(3000, 3999),
  ]);

  const airlinesData = [
    ...(chunk1.data || []),
    ...(chunk2.data || []),
    ...(chunk3.data || []),
    ...(chunk4.data || [])
  ];

  return (
    <AirlinesClient initialAirlines={airlinesData} lang={lang} />
  );
}