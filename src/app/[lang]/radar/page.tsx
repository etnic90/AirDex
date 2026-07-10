import { Suspense } from "react";
import RadarClient from "./RadarClient";
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

  let title = "Aircraft Registry | AirDex";
  let description = "Real-time civil aviation database search and advanced filtering. Explore all active and historic fleet data.";

  if (isIt) {
    title = "Registro Aeromobili | AirDex";
    description = "Ricerca e filtraggio avanzato del database di aviazione civile in tempo reale. Esplora i dati delle flotte attive e storiche.";
  } else if (isEs) {
    title = "Registro de Aeronaves | AirDex";
    description = "Búsqueda y filtrado avanzado en tiempo real de la base de datos de aviación civil. Explora flotas activas e históricas.";
  } else if (isFr) {
    title = "Registre des Aéronefs | AirDex";
    description = "Recherche et filtrage avancés en temps réel de la base de données de l'aviation civile. Explorez les flottes actives et historiques.";
  } else if (isDe) {
    title = "Flugzeugregister | AirDex";
    description = "Echtzeit-Suche und erweiterte Filterung in der zivilen Luftfahrtdatenbank. Entdecken Sie alle aktiven und historischen Flottendaten.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/radar`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/radar`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Radar Fleet Registry",
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

// 1. Il Guscio Server (Prepara l'involucro e passa la lingua)
export default async function RadarPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-12">
      {/* Sfondo radar globale */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      <div className="max-w-[1600px] w-[95%] mx-auto px-4 relative z-10">
        <div className="mb-10 text-center md:text-left border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            Aviation Fleet Database Active
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none font-mono">
            Registro Aeromobili
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Database completo dei modelli di aerei commerciali e storici con parametri di ricerca e filtri avanzati.
          </p>
        </div>

        {/* 2. Il Nucleo Client (Gira nel browser, intercetta l'URL ed esegue i filtri live) */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-64 text-cyan-500">
            <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            <p className="font-mono text-sm tracking-[0.2em] animate-pulse uppercase">Sincronizzazione Rete Satellitare...</p>
          </div>
        }>
          <RadarClient lang={lang} />
        </Suspense>
      </div>
    </main>
  );
}