import type { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import StatsClient from "./StatsClient";

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

  let title = "Global Fleet Statistics | AirDex";
  let description = "Aggregated aviation analytics, including manufacturer fleet sizes, passenger capacity metrics, and historical flight era distributions.";

  if (isIt) {
    title = "Statistiche Globali Flotta | AirDex";
    description = "Analisi aggregate dell'aviazione, tra cui dimensioni della flotta per costruttore, metriche di capienza e distribuzioni per era storica.";
  } else if (isEs) {
    title = "Estadísticas Globales de la Flota | AirDex";
    description = "Análisis agregados de aviación, incluidos los tamaños de flotas por fabricante, métricas de capacidad y distribución de eras de vuelo históricas.";
  } else if (isFr) {
    title = "Statistiques Globales de la Flotte | AirDex";
    description = "Analyses de l'aviation civile, y compris les tailles de flotte par constructeur, capacité passagers moyenne et chronologie des vols.";
  } else if (isDe) {
    title = "Globale Flottenstatistiken | AirDex";
    description = "Aggregierte Luftfahrtdaten-Analysen, einschließlich Flottengrößen nach Hersteller, Passagierkapazitäten und historischen Flugzeitepochen.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/stats`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/stats`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Global Aviation Stats",
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

export default async function StatsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  return (
    <StatsClient lang={resolvedParams.lang} />
  );
}