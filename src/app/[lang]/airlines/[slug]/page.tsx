import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import AirlineDetailClient from "./AirlineDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  
  const { data: airline } = await supabase
    .from("airlines")
    .select("name, country, slogan, logo_url")
    .eq("slug", slug)
    .single();

  if (!airline) {
    return { title: "Airline Not Found | AirDex" };
  }

  const isIt = lang === "it";
  const isEs = lang === "es";
  const isFr = lang === "fr";
  const isDe = lang === "de";

  let title = `${airline.name} | ${airline.country} | AirDex Directory`;
  let description = `Explore the historical profile, active fleet matrix, operational statistics, and details of ${airline.name} in the AirDex Aviation Hangar.`;

  if (isIt) {
    title = `${airline.name} | ${airline.country} | Registro Compagnie`;
    description = `Esplora il profilo storico, la flotta attiva, le statistiche operative e i dettagli di ${airline.name} nell'Hangar dell'aviazione di AirDex.`;
  } else if (isEs) {
    title = `${airline.name} | ${airline.country} | Registro de Aerolíneas`;
    description = `Explore el perfil histórico, la flota activa, las estadísticas operativas y los detalles de ${airline.name} en el hangar de aviación de AirDex.`;
  } else if (isFr) {
    title = `${airline.name} | ${airline.country} | Annuaire des Compagnies`;
    description = `Explorez le profil historique, la flotte active, les statistiques opérationnelles et les détails de ${airline.name} dans le hangar d'aviation d'AirDex.`;
  } else if (isDe) {
    title = `${airline.name} | ${airline.country} | Fluggesellschaften-Verzeichnis`;
    description = `Erkunden Sie das historische Profil, die aktive Flotte, die Betriebsdaten und Details von ${airline.name} im AirDex Luftfahrthangar.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/airlines/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/airlines/${slug}`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: airline.logo_url || "https://airdex.org/images/seo-banner.jpg",
          alt: `${airline.name} logo`,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [airline.logo_url || "https://airdex.org/images/seo-banner.jpg"],
    }
  };
}

export async function generateStaticParams() {
  const { data: airlines } = await supabase
    .from("airlines")
    .select("slug");

  if (!airlines) return [];

  const locales = ['en', 'it', 'es', 'fr', 'de'];

  return airlines.flatMap((airline) =>
    locales.map((lang) => ({
      lang: lang,
      slug: airline.slug,
    }))
  );
}

export default async function AirlineDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  // Verifichiamo l'esistenza e recuperiamo i dati per lo Schema JSON-LD
  const { data: airline } = await supabase
    .from("airlines")
    .select("id, name, iata_code, icao_code, slogan, logo_url, country, founded_year, closed_year, website")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!airline) {
    notFound();
  }

  const airlineJsonLd = {
    "@context": "https://schema.org",
    "@type": "Airline",
    "name": airline.name,
    "alternateName": airline.iata_code || undefined,
    "logo": airline.logo_url || undefined,
    "url": `https://airdex.org/${resolvedParams.lang}/airlines/${resolvedParams.slug}`,
    "slogan": airline.slogan || undefined,
    "foundingDate": airline.founded_year ? String(airline.founded_year) : undefined,
    "dissolutionDate": airline.closed_year ? String(airline.closed_year) : undefined,
    "knowsAbout": "Civil Aviation",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": airline.country
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(airlineJsonLd) }}
      />
      <AirlineDetailClient params={resolvedParams} />
    </>
  );
}