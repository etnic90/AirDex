import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AirDex Blog | Aviation News & Tech Guides",
  description: "Approfondimenti tecnici, analisi comparative e storie dal mondo dell'aviazione civile.",
};

export async function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "it" },
    { lang: "es" },
    { lang: "fr" },
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

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* Intestazione */}
        <div className="mb-12 border-b border-slate-800 pb-6 relative">
          <div className="absolute top-0 left-0 w-20 h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-2">
            Aviation News & Tech
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            Rapporti telemetrici, analisi e approfondimenti editoriali.
          </p>
        </div>

        {error || !articles || articles.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500 font-mono text-sm">
            Nessun articolo pubblicato nel database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => {
              const formattedDate = article.published_at
                ? new Date(article.published_at).toLocaleDateString(lang, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "N/D";

              return (
                <article
                  key={article.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300 flex flex-col group relative"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-cyan-500 transition-colors" />

                  {/* Immagine di Copertina */}
                  <div className="relative h-48 md:h-56 bg-slate-950 overflow-hidden">
                    {article.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.cover_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                        <span className="text-slate-700 font-mono text-xs uppercase tracking-widest">
                          No Image
                        </span>
                      </div>
                    )}
                    <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-cyan-800/60 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider">
                      Analisi
                    </span>
                  </div>

                  {/* Contenuto Card */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-slate-500 font-mono text-xs block mb-2">
                        {formattedDate} — Di {article.author || "Redazione"}
                      </span>
                      <h2 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-6">
                        {article.content}
                      </p>
                    </div>

                    <Link
                      href={`/${lang}/blog/${article.slug}`}
                      className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-xs uppercase tracking-widest group/link transition-colors cursor-pointer"
                    >
                      Leggi Tracciato
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 group-hover/link:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
