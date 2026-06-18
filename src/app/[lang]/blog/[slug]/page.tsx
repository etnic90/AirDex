import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: article } = await supabase
    .from("articles")
    .select("title, content")
    .eq("slug", slug)
    .single();

  if (!article) {
    return { title: "Articolo non trovato | AirDex Blog" };
  }

  const excerpt = article.content.substring(0, 150) + "...";

  return {
    title: `${article.title} | AirDex Blog`,
    description: excerpt,
    openGraph: {
      title: article.title,
      description: excerpt,
    },
  };
}

export async function generateStaticParams() {
  const { data: articles } = await supabase
    .from("articles")
    .select("slug");

  if (!articles) return [];

  const locales = ['en', 'it', 'es', 'fr'];

  return articles.flatMap((article) =>
    locales.map((lang) => ({
      lang: lang,
      slug: article.slug,
    }))
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  // Recupera l'articolo corrente ed altri articoli consigliati in parallelo
  const [
    { data: article, error },
    { data: otherArticles }
  ] = await Promise.all([
    supabase.from("articles").select("*").eq("slug", slug).single(),
    supabase.from("articles").select("title, slug, cover_image_url").neq("slug", slug).limit(3)
  ]);

  if (error || !article) {
    notFound();
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(lang, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/D";

  const isIt = lang === "it";
  const readingTime = Math.ceil((article.content?.split(/\s+/).length || 0) / 200);

  // Formatta i paragrafi dell'articolo e identifica gli elenchi puntati
  const paragraphs = article.content
    ? article.content.split("\n\n").map((p: string) => p.trim()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-white relative overflow-hidden font-sans">
      {/* DATI STRUTTURATI SCHEMA.ORG (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": article.title,
            "image": article.cover_image_url ? [article.cover_image_url] : [],
            "datePublished": article.published_at || article.created_at,
            "dateModified": article.published_at || article.created_at,
            "author": [{
              "@type": "Person",
              "name": article.author || "AirDex Team",
              "url": `https://airdex.com/${lang}/profile`
            }]
          })
        }}
      />
      
      {/* Background radial spotlights */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(6,182,212,0.04),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-[1600px] w-[95%] mx-auto relative z-10 px-4 md:px-10">
        
        {/* Pulsante Torna al Blog */}
        <div className="mb-6">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer font-bold border border-slate-900 bg-slate-950 px-4 py-2 rounded-xl shadow-md"
          >
            &larr; {isIt ? "Torna al Blog" : "Back to Blog"}
          </Link>
        </div>

        {/* BREADCRUMB PATH */}
        <div className="mb-6 text-xs font-mono text-slate-500 uppercase tracking-wider">
          <Link href={`/${lang}`} className="hover:text-cyan-400">Core</Link>
          <span className="mx-2">&gt;</span>
          <Link href={`/${lang}/blog`} className="hover:text-cyan-400">Blog</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-400 truncate max-w-[200px] inline-block align-bottom">{article.slug}</span>
        </div>

        {/* STRUTTURA A 3 COLONNE: CONDIVIDI (1/12) + ARTICOLO (8/12) + CONSIGLIATI (3/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
          
          {/* 1. STICKY SHARE SIDEBAR (LATO SINISTRO - 1 colonna) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 flex lg:flex-col items-center justify-center lg:justify-start gap-4 py-4 border-b lg:border-b-0 lg:border-r border-slate-900 lg:pr-6">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block lg:mb-2 text-center">
              Share
            </span>
            <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-xs font-mono font-black transition-all flex items-center justify-center cursor-pointer shadow-sm">
              X
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-xs font-mono font-black transition-all flex items-center justify-center cursor-pointer shadow-sm">
              FB
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-xs font-mono font-black transition-all flex items-center justify-center cursor-pointer shadow-sm">
              LI
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-xs font-mono font-black transition-all flex items-center justify-center cursor-pointer shadow-sm">
              URL
            </button>
          </aside>

          {/* 2. ARTICOLO EDITORIALE COMPLETO (CENTRO - 8 colonne) */}
          <article className="lg:col-span-8 bg-slate-900/60 border border-slate-800 p-6 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative">
            
            {/* Header dell'articolo */}
            <header className="mb-8 border-b border-slate-800/60 pb-6">
              <div className="flex flex-wrap items-center gap-4 text-slate-500 font-mono text-xs mb-3 uppercase tracking-wider">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>Di {article.author || "Redazione"}</span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">{readingTime} min read</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase font-mono">
                {article.title}
              </h1>
            </header>

            {/* Immagine di Copertina */}
            {article.cover_image_url && (
              <div className="w-full h-64 md:h-[420px] bg-slate-950 rounded-2xl mb-10 overflow-hidden border border-slate-800 relative shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              </div>
            )}

            {/* Contenuto dinamico strutturato in box per paragrafo */}
            <div className="space-y-6">
              {paragraphs.map((p: string, idx: number) => {
                // Riconoscimento titoli inseriti nel testo o elenchi puntati
                const isBulletList = p.startsWith("*");
                
                if (isBulletList) {
                  const items = p.split("\n").map((item: string) => item.replace(/^\*\s*/, "").trim());
                  return (
                    <div key={idx} className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 font-mono text-xs space-y-2.5">
                      {items.map((item: string, itemIdx: number) => (
                        <div key={itemIdx} className="flex gap-3 text-slate-300">
                          <span className="text-cyan-500 font-bold font-sans">-</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    className="bg-slate-950/20 hover:border-slate-800/65 rounded-2xl p-6 border border-slate-900/60 hover:bg-slate-900/10 transition-all duration-300 leading-relaxed font-sans text-base md:text-lg text-slate-300"
                  >
                    {p}
                  </div>
                );
              })}
            </div>

          </article>

          {/* 3. ARTICOLI CONSIGLIATI (LATO DESTRO - 3 colonne) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 flex flex-col gap-8 w-full">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-5 border-b border-slate-950 pb-2 font-mono">
                {isIt ? "Analisi Correlate" : "Recommended Reading"}
              </h4>
              
              <div className="flex flex-col gap-6">
                {otherArticles && otherArticles.length > 0 ? (
                  otherArticles.map((item: any, index: number) => (
                    <Link 
                      key={index}
                      href={`/${lang}/blog/${item.slug}`}
                      className="group flex flex-col gap-2.5 border-b border-slate-950 pb-4 last:border-b-0 last:pb-0"
                    >
                      {item.cover_image_url && (
                        <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-900 relative">
                          <img 
                            src={item.cover_image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                          />
                        </div>
                      )}
                      <div>
                        <h5 className="text-white font-bold text-xs uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors font-mono">
                          {item.title}
                        </h5>
                        <span className="text-[10px] text-cyan-500 font-mono uppercase font-black block mt-2">
                          {isIt ? "Leggi Report &rarr;" : "Read Report &rarr;"}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs font-mono text-slate-600">Nessuna altra analisi caricata.</p>
                )}
              </div>
            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}
