"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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

  // Editor View Mode: "list" o "edit"
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form Stati
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"write" | "preview">("write");

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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
    setView("edit");
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setContent(article.content);
    setCoverImageUrl(article.cover_image_url || "");
    setAuthor(article.author || "");
    setIsPublished(article.is_published);
    setView("edit");
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
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editingArticle.id);

      if (error) {
        alert("Errore durante il salvataggio: " + error.message);
      } else {
        setView("list");
        fetchArticles();
      }
    } else {
      const { error } = await supabase
        .from("articles")
        .insert([payload]);

      if (error) {
        alert("Errore durante l'inserimento: " + error.message);
      } else {
        setView("list");
        fetchArticles();
      }
    }
  };

  // Funzione per inserire tag Markdown/HTML nel testo selezionato dell'editor
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "testo") + after;

    setContent(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || "testo").length);
    }, 50);
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.author && a.author.toLowerCase().includes(search.toLowerCase()))
    );
  }, [articles, search]);

  // Semplice rendering di anteprima dell'articolo
  const renderPreview = () => {
    const paragraphs = content.split("\n\n").map((p) => p.trim()).filter(Boolean);
    return (
      <div className="space-y-4 font-sans text-slate-350 p-6 bg-slate-950/40 border border-slate-900 rounded-xl max-h-[500px] overflow-y-auto">
        <h1 className="text-2xl font-black text-white font-mono uppercase border-b border-slate-800 pb-3">
          {title || "Titolo Anteprima"}
        </h1>
        {paragraphs.map((p, idx) => {
          if (p.startsWith("## ")) {
            return <h2 key={idx} className="text-xl font-bold text-white border-b border-slate-800 pt-4 pb-2">{p.replace(/^##\s*/, "")}</h2>;
          }
          if (p.startsWith("### ")) {
            return <h3 key={idx} className="text-lg font-bold text-white pt-3 pb-1">{p.replace(/^###\s*/, "")}</h3>;
          }
          if (p.startsWith("*") || p.startsWith("-")) {
            return (
              <ul key={idx} className="list-disc list-inside pl-4 space-y-1">
                {p.split("\n").map((item, i) => (
                  <li key={i}>{item.replace(/^[\*\-]\s*/, "")}</li>
                ))}
              </ul>
            );
          }
          return <p key={idx} className="leading-relaxed">{p}</p>;
        })}
      </div>
    );
  };

  if (view === "edit") {
    return (
      <div className="space-y-6 text-slate-100 font-sans">
        
        {/* Editor TopBar */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("list")}
              className="bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              &larr; Torna alla lista
            </button>
            <div>
              <h1 className="text-xl font-black text-white font-mono uppercase tracking-wider">
                {editingArticle ? "Modifica Articolo" : "Nuovo Articolo"}
              </h1>
              <span className="text-[10px] text-slate-500 font-mono">WordPress-style Editor Engine v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={(e) => handleSubmit(e)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10"
            >
              Pubblica / Salva
            </button>
          </div>
        </div>

        {/* WordPress 2-Column Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: EDITOR PRINCIPALE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Input Titolo */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <label className="block text-slate-400 uppercase font-mono text-xs font-bold">Titolo Articolo</label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Inserisci il titolo dell'articolo..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none p-4 rounded-xl text-lg font-bold text-white"
              />
            </div>

            {/* WYSIWYG / Markdown Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              
              {/* Toolbar Editor */}
              <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded text-xs cursor-pointer"
                    title="Grassetto"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-350 italic rounded text-xs cursor-pointer"
                    title="Corsivo"
                  >
                    I
                  </button>
                  <span className="text-slate-800 mx-1">|</span>
                  <button
                    type="button"
                    onClick={() => insertFormatting("## ", "")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono rounded text-xs cursor-pointer"
                    title="Intestazione 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("### ", "")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono rounded text-xs cursor-pointer"
                    title="Intestazione 3"
                  >
                    H3
                  </button>
                  <span className="text-slate-800 mx-1">|</span>
                  <button
                    type="button"
                    onClick={() => insertFormatting("[link description](", ")")}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] uppercase font-bold cursor-pointer"
                    title="Inserisci Link"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("* elemento\n* elemento", "")}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] uppercase font-bold cursor-pointer"
                    title="Elenco Puntato"
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("```html\n", "\n```")}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] uppercase font-bold cursor-pointer"
                    title="Codice"
                  >
                    Code
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("write")}
                    className={`px-3 py-1 font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-all ${
                      activeEditorTab === "write" ? "bg-cyan-500 text-slate-950" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Editor Scrittura
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("preview")}
                    className={`px-3 py-1 font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-all ${
                      activeEditorTab === "preview" ? "bg-cyan-500 text-slate-950" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Anteprima Output
                  </button>
                </div>
              </div>

              {/* Contenuto Editor */}
              <div className="p-6">
                {activeEditorTab === "write" ? (
                  <textarea
                    ref={contentTextareaRef}
                    required
                    rows={16}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Inizia a scrivere l'articolo qui in formato markdown o testo puro. Vai a capo due volte per creare un nuovo paragrafo..."
                    className="w-full bg-slate-950 border border-slate-850 p-4 rounded-xl focus:border-cyan-500 focus:outline-none text-white text-sm font-sans leading-relaxed"
                  />
                ) : (
                  renderPreview()
                )}
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: SIDEBAR IMPOSTAZIONI WIDGET */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Pubblica */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>⚙️</span> Pubblicazione
              </h3>
              <div className="space-y-3 text-xs font-mono text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Stato:</span>
                  <span className={isPublished ? "text-emerald-450 font-bold" : "text-amber-500 font-bold"}>
                    {isPublished ? "Pronto a pubblicare" : "Bozza"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Data:</span>
                  <span className="text-slate-300">
                    {editingArticle ? new Date(editingArticle.published_at).toLocaleDateString() : "Immediata"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-slate-950">
                  <input
                    type="checkbox"
                    id="is_published_sidebar"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="is_published_sidebar" className="text-slate-200 cursor-pointer uppercase select-none">
                    Pubblica Online
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Salva Modifiche
              </button>
            </div>

            {/* Widget 2: Permalink & Autore */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🔗</span> URL & Autore
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-mono text-[10px] font-bold">Slug (Permalink)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs font-mono focus:border-cyan-500 focus:outline-none text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-mono text-[10px] font-bold">Autore</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs font-mono focus:border-cyan-500 focus:outline-none text-white"
                  />
                </div>
              </div>
            </div>

            {/* Widget 3: Immagine in Evidenza */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-white font-mono text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span>🖼️</span> Immagine in Evidenza
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase font-mono text-[10px] font-bold">URL Copertina</label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs font-mono focus:border-cyan-500 focus:outline-none text-white"
                  />
                </div>
                {coverImageUrl.trim() !== "" ? (
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-850 relative">
                    <img 
                      src={coverImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-full border border-dashed border-slate-850 bg-slate-950/40 rounded-xl flex items-center justify-center text-[10px] text-slate-600 font-mono text-center px-4">
                    Nessuna immagine in evidenza selezionata
                  </div>
                )}
              </div>
            </div>

          </div>

        </form>
      </div>
    );
  }

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

    </div>
  );
}
