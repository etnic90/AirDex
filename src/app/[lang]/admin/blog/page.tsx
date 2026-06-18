"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  published_at: string;
  is_published: boolean;
  author: string | null;
}

export default function AdminBlogManager() {
  const params = useParams();
  const lang = params?.lang || "en";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modale Stati
  const [isOpen, setIsOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form Stati
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, [supabase]);

  // Genera Slug in automatico dal titolo
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingArticle) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setTitle("");
    setSlug("");
    setContent("");
    setCoverImageUrl("");
    setAuthor("Redazione");
    setIsPublished(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setContent(article.content);
    setCoverImageUrl(article.cover_image_url || "");
    setAuthor(article.author || "");
    setIsPublished(article.is_published);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo articolo? L'operazione non è reversibile.")) return;
    
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      alert("Titolo, Slug e Contenuto sono obbligatori.");
      return;
    }

    const payload = {
      title,
      slug,
      content,
      cover_image_url: coverImageUrl.trim() || null,
      author: author.trim() || null,
      is_published: isPublished,
      published_at: editingArticle ? editingArticle.published_at : new Date().toISOString(),
    };

    if (editingArticle) {
      // Modifica
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editingArticle.id);

      if (error) {
        alert("Errore durante il salvataggio: " + error.message);
      } else {
        setIsOpen(false);
        fetchArticles();
      }
    } else {
      // Creazione
      const { error } = await supabase
        .from("articles")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setIsOpen(false);
        fetchArticles();
      }
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.author && a.author.toLowerCase().includes(search.toLowerCase()))
    );
  }, [articles, search]);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono">CPT: News & Articoli</h1>
          <p className="text-slate-400 font-mono text-xs uppercase">Gestione e scrittura dei contenuti editoriali del blog</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-lg font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
        >
          ✍️ Scrivi Nuovo Articolo
        </button>
      </div>

      {/* Cerca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Cerca per titolo, autore o slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-3 rounded-lg font-mono text-xs text-white placeholder:text-slate-700"
        />
      </div>

      {/* Listato */}
      {loading ? (
        <div className="py-12 text-center text-cyan-500 font-mono text-xs animate-pulse">
          Caricamento articoli nel database...
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-widest font-black">
                  <th className="p-4">Copertina</th>
                  <th className="p-4">Titolo</th>
                  <th className="p-4">Autore</th>
                  <th className="p-4">Pubblicato</th>
                  <th className="p-4">Stato</th>
                  <th className="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-950/20 transition-all">
                    <td className="p-4">
                      {article.cover_image_url ? (
                        <img 
                          src={article.cover_image_url} 
                          alt="Cover" 
                          className="w-16 h-10 object-cover rounded border border-slate-800"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-slate-950 border border-slate-850 rounded flex items-center justify-center text-[8px] text-slate-700">
                          NO IMAGE
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-sans max-w-xs">
                      <span className="text-white font-bold block">{article.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">slug: {article.slug}</span>
                    </td>
                    <td className="p-4 text-slate-300">{article.author || "Redazione"}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(article.published_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {article.is_published ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900 text-emerald-400 text-[10px] font-bold">
                          PUBBLICATO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-500 text-[10px] font-bold">
                          BOZZA
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(article)}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="bg-red-950/10 hover:bg-red-950/30 border border-red-900/20 hover:border-red-500 text-red-400 px-3 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-800 bg-slate-950/10 text-center py-12 text-slate-500 font-mono text-xs rounded-xl">
          Nessun articolo trovato corrispondente ai filtri di ricerca.
        </div>
      )}

      {/* Modale Creazione / Modifica */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-mono"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono mb-6 pb-2 border-b border-slate-850">
              {editingArticle ? "Modifica Articolo" : "Crea Nuovo Articolo"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs text-slate-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Titolo</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="Esempio: Boeing 777X in test a Seattle"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Slug (Permalink)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="boeing-777x-in-test-seattle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">Autore</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="Redazione / Nome Autore"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1.5">URL Immagine Copertina</label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs"
                    placeholder="https://images.unsplash.com/photo..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1.5">Corpo Articolo (Markdown supportato)</label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg focus:border-cyan-500 focus:outline-none text-white text-xs font-sans"
                  placeholder="Inserisci il contenuto dell'articolo. Puoi dividere in paragrafi andando a capo due volte..."
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="is_published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <label htmlFor="is_published" className="text-slate-300 font-bold uppercase cursor-pointer select-none">
                  Pubblica articolo immediatamente
                </label>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  Salva Articolo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
