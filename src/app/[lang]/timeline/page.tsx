import { supabase } from "@/lib/supabase";
import TimelineClient from "./TimelineClient";
import type { Metadata } from "next";
import { AircraftModel } from "@/types";

export const metadata: Metadata = {
  title: "Timeline Storica | AirDex",
  description: "Esplora l'evoluzione tecnologica dei velivoli civili dal 1910 a oggi, catalogati in base alle epoche chiave del volo.",
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
