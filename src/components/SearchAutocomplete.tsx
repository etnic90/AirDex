"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  id: string;
  model_name: string;
  manufacturer: string;
};

interface SearchAutocompleteProps {
  lang: string;
  searchIndex: SearchItem[];
}

export default function SearchAutocomplete({ lang, searchIndex }: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Motore di filtraggio istantaneo (lato client)
  useEffect(() => {
    if (query.trim().length > 1) {
      const term = query.toLowerCase();
      const filtered = searchIndex
        .filter(
          (item) =>
            item.model_name.toLowerCase().includes(term) ||
            item.manufacturer.toLowerCase().includes(term)
        )
        .slice(0, 6); // Mostra i top 6 risultati
      setResults(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, searchIndex]);

  // Chiude il menu a tendina se clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gestione dell'invio (Invio = Vai al Radar Globale)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${lang}/radar?search=${encodeURIComponent(query)}`);
    }
  };

  // Click sul suggerimento (Click = Vai alla singola pagina dell'aereo)
  const handleSelect = (id: string) => {
    setIsOpen(false);
    router.push(`/${lang}/aircraft/${id}`);
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl relative group mb-20">
      <div className="absolute inset-0 bg-cyan-500/15 blur-2xl rounded-2xl group-hover:bg-cyan-500/25 transition-all duration-500"></div>
      
      <form onSubmit={handleSubmit} className="relative flex flex-col md:flex-row bg-slate-900/90 border border-slate-800 group-hover:border-cyan-500/50 rounded-2xl p-2.5 backdrop-blur-2xl transition-all shadow-2xl z-20">
        <div className="flex items-center flex-1 px-3">
          <svg className="w-5 h-5 text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 1 && setIsOpen(true)}
            placeholder="Inserisci Modello, Costruttore, Sigla ICAO (es. B747, Concorde)..." 
            className="w-full bg-transparent border-none text-white p-4 focus:outline-none font-mono text-sm placeholder-slate-500"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black font-mono text-xs tracking-widest uppercase px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] mt-2 md:mt-0">
          INTERCETTA
        </button>
      </form>

      {/* DROPDOWN RISULTATI PREDITTIVI */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 border border-cyan-900/50 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl z-30 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800 text-[10px] text-cyan-500 font-mono tracking-widest uppercase">
            Traiettorie Rilevate ({results.length})
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-800 flex justify-between items-center group transition-colors border-b border-slate-800/50 last:border-0"
                >
                  <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {item.model_name}
                  </span>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    {item.manufacturer}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}