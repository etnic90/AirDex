import { supabase } from "@/lib/supabase";
import TimelineClient from "./TimelineClient";
import type { Metadata } from "next";
import { AircraftModel } from "@/types";

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

  let title = "Aviation Historical Timeline | AirDex";
  let description = "Explore the technological evolution of civil aircraft from 1910 to today, categorized by key flight eras.";

  if (isIt) {
    title = "Timeline Storica | AirDex";
    description = "Esplora l'evoluzione tecnologica dei velivoli civili dal 1910 a oggi, catalogati in base alle epoche chiave del volo.";
  } else if (isEs) {
    title = "Línea de Tiempo Histórica | AirDex";
    description = "Explore la evolución tecnológica de los aviones civiles desde 1910 hasta hoy, clasificados por eras clave del vuelo.";
  } else if (isFr) {
    title = "Chronologie Historique | AirDex";
    description = "Explorez l'évolution technologique des avions civils de 1910 à nos jours, classés par époques clés du vol.";
  } else if (isDe) {
    title = "Historische Zeitleiste | AirDex";
    description = "Erkunden Sie die technologische Entwicklung von Zivilflugzeugen von 1910 bis heute, kategorisiert nach Epochen.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.airdex.org/${lang}/timeline`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.airdex.org/${lang}/timeline`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://www.airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Aviation Timeline",
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
  return [
    { lang: "en" },
    { lang: "it" },
    { lang: "es" },
    { lang: "fr" },
    { lang: "de" },
  ];
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Eseguiamo il fetch sul server ordinato per anno di primo volo
  const { data: aircraftsData } = await supabase
    .from("aircraft_models")
    .select(`
      id,
      model_name,
      type,
      first_flight_year,
      status,
      rarity,
      house_livery_url,
      description,
      trivia,
      max_passengers,
      range_km,
      manufacturers ( name )
    `)
    .order("first_flight_year", { ascending: true });

  return (
    <TimelineClient 
      initialAircrafts={(aircraftsData || []) as unknown as AircraftModel[]} 
      lang={lang} 
    />
  );
}
