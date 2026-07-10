"use client";

import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  lang: string;
}

export default function Breadcrumbs({ items, lang }: BreadcrumbsProps) {
  const baseUrl = "https://airdex.org";

  // Costruisce la lista strutturata per Schema.org JSON-LD
  const breadcrumbListJson = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => {
      const element: Record<string, unknown> = {
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.label,
      };
      if (item.href) {
        // Rende l'URL assoluto per conformità alle linee guida Schema.org
        element["item"] = item.href.startsWith("http") 
          ? item.href 
          : `${baseUrl}${item.href}`;
      } else {
        // Se non c'è href (ultimo elemento), usa la pagina corrente
        element["item"] = `${baseUrl}/${lang}`;
      }
      return element;
    }),
  };

  return (
    <>
      {/* Iniezione dello schema JSON-LD BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJson) }}
      />

      {/* Render dell'interfaccia Breadcrumb */}
      <nav 
        aria-label="Breadcrumb" 
        className="mb-8 text-xs font-mono text-slate-500 uppercase tracking-widest flex flex-wrap items-center gap-2 select-none"
      >
        <Link 
          href={`/${lang}`} 
          className="hover:text-cyan-400 transition-colors font-bold"
        >
          Hangar
        </Link>
        
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <span className="text-slate-700 font-bold">&gt;</span>
              {isLast || !item.href ? (
                <span className="text-slate-400 font-bold truncate max-w-[240px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href} 
                  className="hover:text-cyan-400 transition-colors font-bold"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
