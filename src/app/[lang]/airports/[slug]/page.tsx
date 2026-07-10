import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import AirportDetailClient from "./AirportDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  
  const { data: airport } = await supabase
    .from("airports")
    .select("name, city, country, iata_code, icao_code")
    .eq("slug", slug)
    .single();

  if (!airport) {
    return { title: "Airport Not Found | AirDex" };
  }

  const isIt = lang === "it";
  const isEs = lang === "es";
  const isFr = lang === "fr";
  const isDe = lang === "de";

  let title = `${airport.name} (${airport.iata_code}/${airport.icao_code}) | AirDex Hubs`;
  let description = `Explore runway details, METAR decoder, GPS coordinates, tower frequencies, and active hubs of ${airport.name} in ${airport.city}, ${airport.country}.`;

  if (isIt) {
    title = `${airport.name} (${airport.iata_code}/${airport.icao_code}) | Terminale Scali`;
    description = `Esplora dettagli delle piste, decodificatore METAR, coordinate GPS, frequenze torre e hub attivi di ${airport.name} a ${airport.city}, ${airport.country}.`;
  } else if (isEs) {
    title = `${airport.name} (${airport.iata_code}/${airport.icao_code}) | Terminal de Aeropuertos`;
    description = `Explore detalles de pistas, descodificador METAR, coordenadas GPS, frecuencias de torre y centros de conexión de ${airport.name} en ${airport.city}, ${airport.country}.`;
  } else if (isFr) {
    title = `${airport.name} (${airport.iata_code}/${airport.icao_code}) | Fiche de l'Aéroport`;
    description = `Explorez les pistes, décodeur METAR, coordonnées GPS, fréquences radio ATC et compagnies de ${airport.name} à ${airport.city}, ${airport.country}.`;
  } else if (isDe) {
    title = `${airport.name} (${airport.iata_code}/${airport.icao_code}) | Flughafendetails`;
    description = `Erkunden Sie Landebahn-Spezifikationen, METAR-Daten, GPS-Koordinaten, ATC-Frequenzen und aktive Fluggesellschaften-Hubs von ${airport.name} in ${airport.city}, ${airport.country}.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.airdex.org/${lang}/airports/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.airdex.org/${lang}/airports/${slug}`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://www.airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: airport.name,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.airdex.org/images/seo-banner.jpg"],
    }
  };
}

export async function generateStaticParams() {
  const { data: airports } = await supabase
    .from("airports")
    .select("slug");

  if (!airports) return [];

  const locales = ['en', 'it', 'es', 'fr', 'de'];

  return airports.flatMap((airport) =>
    locales.map((lang) => ({
      lang: lang,
      slug: airport.slug,
    }))
  );
}

export default async function AirportDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  // Verifichiamo l'esistenza e carichiamo i dati per lo schema JSON-LD
  const { data: airport } = await supabase
    .from("airports")
    .select("id, name, city, country, latitude, longitude, iata_code, icao_code")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!airport) {
    notFound();
  }

  const airportJsonLd = {
    "@context": "https://schema.org",
    "@type": "Airport",
    "name": airport.name,
    "iataCode": airport.iata_code || undefined,
    "icaoCode": airport.icao_code || undefined,
    "geo": (airport.latitude && airport.longitude) ? {
      "@type": "GeoCoordinates",
      "latitude": airport.latitude,
      "longitude": airport.longitude
    } : undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": airport.city,
      "addressCountry": airport.country
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(airportJsonLd) }}
      />
      <AirportDetailClient />
    </>
  );
}