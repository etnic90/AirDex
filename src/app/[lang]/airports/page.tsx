import { supabase } from "@/lib/supabase";
import AirportsClient from "./AirportsClient";
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

  let title = "Airports Hub Directory | AirDex";
  let description = "Explore global commercial passenger hubs. Monitor coordinates, runways, operative gates, and alliance flight networks.";

  if (isIt) {
    title = "Terminale Aeroporti | AirDex";
    description = "Esplora gli hub passeggeri commerciali del mondo. Monitora coordinate, altitudini, piste operative e allacciamenti delle alleanze globali.";
  } else if (isEs) {
    title = "Directorio de Aeropuertos | AirDex";
    description = "Explore los centros de conexión de pasajeros. Monitoree coordenadas, pistas, puertas operativas y redes de alianzas globales.";
  } else if (isFr) {
    title = "Annuaire des Aéroports | AirDex";
    description = "Explorez les hubs passagers mondiaux. Surveillez les coordonnées, les pistes d'atterrissage, les portes d'embarquement et les alliances.";
  } else if (isDe) {
    title = "Flughafen-Verzeichnis | AirDex";
    description = "Erkunden Sie globale Passagier-Hubs. Überwachen Sie Koordinaten, Start- und Landebahnen, Gates und globale Bündnisse.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/airports`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/airports`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Airports Directory",
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

export default async function AirportsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // PostgREST ha un limite fisso di 1000 righe per chiamata.
  // Selezioniamo solo le colonne richieste per ridurre il carico di banda del 90% ed evitare timeout sul server.
  const fields = "id, name, iata_code, icao_code, city, country, runways_count, elevation_ft, annual_passengers_mio, image_url, slug";
  const [chunk1, chunk2, chunk3] = await Promise.all([
    supabase.from("airports").select(fields).range(0, 999),
    supabase.from("airports").select(fields).range(1000, 1999),
    supabase.from("airports").select(fields).range(2000, 2999),
  ]);

  const airportsData = [
    ...(chunk1.data || []),
    ...(chunk2.data || []),
    ...(chunk3.data || [])
  ];

  return (
    <AirportsClient initialAirports={airportsData} lang={lang} />
  );
}