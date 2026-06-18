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

  // Prende le prime 150 lettere come descrizione
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

  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

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

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center">
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
      <article className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-2xl border border-slate-800">
        
        {/* Pulsante Torna al Blog */}
        <Link
          href={`/${lang}/blog`}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest mb-8 transition-colors group cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Torna alle News
        </Link>

        {/* Header dell'articolo */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <span className="text-cyan-500 font-mono text-xs block mb-2 uppercase tracking-widest">
            {formattedDate} — Di {article.author || "Redazione"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            {article.title}
          </h1>
        </header>

        {/* Copertina dell'articolo */}
        {article.cover_image_url && (
          <div className="w-full h-64 md:h-[400px] bg-cyan-950/10 rounded-xl mb-10 overflow-hidden border border-slate-800 relative shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Contenuto dell'articolo */}
        <div className="text-slate-300 leading-relaxed font-sans text-lg whitespace-pre-wrap selection:bg-cyan-800/30">
          {article.content}
        </div>

      </article>
    </main>
  );
}
