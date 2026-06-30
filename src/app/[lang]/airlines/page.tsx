import { supabase } from "@/lib/supabase";
import AirlinesClient from "./AirlinesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminal Aerolinee | AirDex",
  description: "Esplora l'indice degli operatori aerei civili storici e attivi. Analizza codici, alleanze, hub strategici e flotta.",
};

export async function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "it" },
    { lang: "es" },
    { lang: "fr" },
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
  const fields = "id, name, iata_code, icao_code, country, founded_year, closed_year, logo_url, alliance, main_hub, slogan, website, callsign";
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