import type { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import CompareClient from "./CompareClient";

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

  let title = "Aircraft Comparison | AirDex";
  let description = "Compare two civil aircraft models side by side. Overlay specifications like operating range, max passenger capacity, speed, and service ceiling on a polar chart.";

  if (isIt) {
    title = "Confronto Aeromobili | AirDex";
    description = "Confronta due modelli di aeromobili civili fianco a fianco. Sovrapponi specifiche come autonomia operativa, capienza massima passeggeri, velocità e quota su grafico radar.";
  } else if (isEs) {
    title = "Comparación de Aeronaves | AirDex";
    description = "Compare dos modelos de aviones civiles lado a lado. Superponga especificaciones como alcance operativo, capacidad máxima de pasajeros, velocidad y techo en un gráfico radar.";
  } else if (isFr) {
    title = "Comparatif d'Avions | AirDex";
    description = "Comparez deux modèles d'aéronefs civils côte à côte. Superposez des spécifications comme la distance franchissable, le nombre de passagers, la vitesse et le plafond.";
  } else if (isDe) {
    title = "Flugzeugvergleich | AirDex";
    description = "Vergleichen Sie zwei Zivilflugzeuge Seite an Seite. Überlagern Sie Spezifikationen wie Reichweite, Passagierkapazität, Geschwindigkeit und Dienstgipfelhöhe auf einem Radardiagramm.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/compare`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/compare`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Aircraft Comparison Deck",
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

export default async function ComparePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.lang);

  return (
    <CompareClient lang={resolvedParams.lang} />
  );
}