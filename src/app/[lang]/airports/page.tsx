import { supabase } from "@/lib/supabase";
import AirportsClient from "./AirportsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminale Aeroporti | AirDex",
  description: "Esplora gli hub passeggeri commerciali del mondo. Monitora coordinate, altitudini, piste operative e allacciamenti delle alleanze globali.",
};

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