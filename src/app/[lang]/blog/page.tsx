import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { setRequestLocale } from 'next-intl/server';
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

  let title = "AirDex Blog | Aviation News & Tech Guides";
  let description = "Technical insights, comparative analyses, and stories from the world of civil aviation.";

  if (isIt) {
    title = "Blog AirDex | News & Guide Aeronautiche";
    description = "Approfondimenti tecnici, analisi comparative e storie dal mondo dell'aviazione civile.";
  } else if (isEs) {
    title = "Blog AirDex | Noticias y Guías de Aviación";
    description = "Perspectivas técnicas, análisis comparativos e historias del mundo de la aviación civil.";
  } else if (isFr) {
    title = "Blog AirDex | Actualités & Guides de l'Aviation";
    description = "Analyses techniques, études comparatives et récits du monde de l'aviation civile.";
  } else if (isDe) {
    title = "AirDex Blog | Luftfahrt-News & Technische Anleitungen";
    description = "Technische Einblicke, vergleichende Analysen und Geschichten aus der Welt der zivilen Luftfahrt.";
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://airdex.org/${lang}/blog`,
    },
    openGraph: {
      title,
      description,
      url: `https://airdex.org/${lang}/blog`,
      siteName: "AirDex",
      locale: lang,
      type: "website",
      images: [
        {
          url: "https://airdex.org/images/seo-banner.jpg",
          width: 1200,
          height: 630,
          alt: "AirDex Aviation Blog",
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

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  // Recupera tutti gli articoli pubblicati
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const isIt = lang === "it";

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white relative overflow-hidden font-sans">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[400px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.03),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10 px-4 md:px-10">
        
        {/* Intestazione */}
        <div className="mb-10 text-center md:text-left border-b border-slate-900 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            Aviation Editorial Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none font-mono">
            Aviation News & Tech
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed mx-auto md:mx-0">
            {isIt ? "Rapporti telemetrici, analisi e approfondimenti editoriali del settore aeronautico." : "Telemetry reports, analyses, and editorial deep-dives in the aeronautics sector."}
          </p>
        </div>

        {/* CONTENUTO IN 2 COLONNE: ARTICOLI (9/12) + SIDEBAR (3/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
          
          {/* COLONNA SINISTRA: GRID ARTICOLI */}
          <div className="lg:col-span-9 w-full">
            {error || !articles || articles.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center text-slate-500 font-mono text-sm shadow-inner">
                {isIt ? "Nessun articolo pubblicato nel database." : "No articles published in database."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {articles.map((article) => {
                  const formattedDate = article.published_at
                    ? new Date(article.published_at).toLocaleDateString(lang, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/D";

                  return (
                    <article
                      key={article.id}
                      className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_0_35px_rgba(6,182,212,0.1)] transition-all duration-300 flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Immagine di Copertina */}
                        <div className="relative h-48 bg-slate-950 overflow-hidden">
                          {article.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                              <span className="text-slate-700 font-mono text-xs uppercase tracking-widest">
                                No Image
                              </span>
                            </div>
                          )}
                          <span className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md text-cyan-400 border border-cyan-850 px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold">
                            {isIt ? "Analisi" : "Analysis"}
                          </span>
                        </div>

                        {/* Contenuto Card */}
                        <div className="p-6">
                          <span className="text-slate-500 font-mono text-xs block mb-2">
                            {formattedDate} — Di {article.author || "Redazione"}
                          </span>
                          <h2 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2 uppercase font-mono tracking-tight leading-snug">
                            {article.title}
                          </h2>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3 font-sans">
                            {article.content}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2">
                        <Link
                          href={`/${lang}/blog/${article.slug}`}
                          className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-305 font-mono text-xs uppercase tracking-widest group/link transition-colors cursor-pointer font-bold"
                        >
                          {isIt ? "Leggi Tracciato" : "View Article"} &rarr;
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLONNA DESTRA: SIDEBAR COMPLETA */}
          <aside className="lg:col-span-3 w-full flex flex-col gap-8 lg:sticky lg:top-24">
            
            {/* Widget 1: Ricerca (Decorativa) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 font-mono">
                {isIt ? "Cerca Articolo" : "Search Blog"}
              </h4>
              <div className="relative">
                <input 
                  type="text" 
                  disabled
                  placeholder={isIt ? "Cerca news..." : "Search news..."}
                  className="w-full p-3.5 rounded-xl bg-slate-950 text-slate-500 border border-slate-900 text-xs focus:outline-none placeholder:text-slate-700 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Widget 2: Categorie AvGeek */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 font-mono">
                {isIt ? "Aree Tematiche" : "Categories"}
              </h4>
              <div className="flex flex-col gap-2.5 font-mono text-xs text-slate-400">
                <div className="flex justify-between py-1 border-b border-slate-950 hover:text-cyan-400 transition-colors cursor-pointer">
                  <span>OPERAZIONI FLOTTE</span>
                  <span className="text-slate-600 font-bold">12</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-950 hover:text-cyan-400 transition-colors cursor-pointer">
                  <span>INGEGNERIA AVIONICA</span>
                  <span className="text-slate-600 font-bold">8</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-950 hover:text-cyan-400 transition-colors cursor-pointer">
                  <span>GUIDE SPOTTER</span>
                  <span className="text-slate-600 font-bold">15</span>
                </div>
                <div className="flex justify-between py-1 hover:text-cyan-400 transition-colors cursor-pointer">
                  <span>REGISTRI AEROPORTUALI</span>
                  <span className="text-slate-600 font-bold">6</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Newsletter Iscrizione Rete */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group shadow-inner">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 font-mono relative z-10">
                {isIt ? "Newsletter Avionica" : "Avionics Feed"}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-4 relative z-10 font-sans">
                {isIt 
                  ? "Ricevi direttamente via e-mail i piani di volo e le telemetrie degli aeromobili più rari del mondo."
                  : "Get flight schedules and rare aircraft telemetries delivered straight to your terminal."}
              </p>
              
              <input 
                type="email" 
                placeholder="pilot@airdex.com"
                className="w-full p-3.5 rounded-xl bg-slate-950 text-white border border-slate-900 focus:border-cyan-500 focus:outline-none text-xs font-mono mb-3 relative z-10 placeholder:text-slate-755"
              />
              <button className="w-full py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-all relative z-10 cursor-pointer">
                {isIt ? "Registra Canale" : "Subscribe Terminal"}
              </button>
            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}
