"use client";

import { useState } from "react";

interface AffiliateWidgetProps {
  modelName: string;
  manufacturerName: string;
  rarity?: string;
  status?: string;
}

export default function AffiliateWidget({
  modelName,
  manufacturerName,
  rarity = "COMMON",
  status = "ACTIVE",
}: AffiliateWidgetProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Calcola i dettagli del modello da collezione basandosi sull'aereo
  const getCollectibleDetails = () => {
    const isHistoric = status === "HISTORIC";
    const isBig = modelName.includes("747") || modelName.includes("380") || modelName.includes("777") || modelName.includes("350");
    const scale = isBig ? "1:400" : "1:200";
    
    let price = 49.99;
    let material = "Metallo Die-Cast Pressofuso";
    let link = `https://www.amazon.it/s?k=modello+collezione+${encodeURIComponent(manufacturerName)}+${encodeURIComponent(modelName)}`;

    if (rarity === "LEGENDARY" || rarity === "EPIC") {
      price = 119.50;
      material = "Resina Solida Premium verniciata a mano";
    } else if (isHistoric) {
      price = 85.00;
      material = "Edizione Storica Limitata Die-Cast";
    } else if (rarity === "RARE") {
      price = 74.90;
      material = "Metallo Die-Cast Premium con Piedistallo";
    }

    return { scale, price: price.toFixed(2), material, link };
  };

  // Calcola i dettagli del simulatore basandosi sull'aereo
  const getSimDetails = () => {
    let dev = "Aerosoft";
    let platform = "MSFS 2024 / X-Plane 12";
    let type = "Studio-Level Replica";
    let price = "69.99";

    const nameLower = modelName.toLowerCase();
    if (nameLower.includes("737") || nameLower.includes("777")) {
      dev = "PMDG Simulations";
      type = "Study-Level Pro Add-on";
      price = "77.99";
    } else if (nameLower.includes("320") || nameLower.includes("321") || nameLower.includes("319")) {
      dev = "Fenix Simulations";
      type = "High-Fidelity Flight Deck Replica";
      price = "59.99";
    } else if (nameLower.includes("concorde")) {
      dev = "DC Designs";
      type = "Supersonic Flight Dynamics Pack";
      price = "39.99";
    } else if (nameLower.includes("md-80") || nameLower.includes("md-11") || nameLower.includes("dc-9")) {
      dev = "Leonardo SH";
      type = "Maddog X Classic Expansion";
      price = "89.00";
    }

    return { dev, platform, type, price };
  };

  const collectible = getCollectibleDetails();
  const sim = getSimDetails();

  return (
    <div className="w-full border-t border-slate-800/60 mt-16 pt-10 font-mono">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-cyan-400 text-sm uppercase tracking-[0.3em] flex items-center gap-3 font-black">
          <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping shrink-0"></span>
          AvGeek Sponsorship & Collectibles
        </h3>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest hidden sm:inline">
          AirDex Sponsor Network
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* CARD 1: MODELLINO DA COLLEZIONE (AMAZON AFFILIATE) */}
        <div
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between transition-all duration-350 hover:border-cyan-500/30 hover:bg-slate-900/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] overflow-hidden group"
        >
          {/* Neon Gradient Overlay on Hover */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-800/30">
                Modellino in Scala
              </span>
              <span className="text-[10px] text-slate-500 font-bold">Scala {collectible.scale}</span>
            </div>

            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 group-hover:text-cyan-400 transition-colors">
              {manufacturerName} {modelName}
            </h4>
            <p className="text-[11px] text-slate-400 mb-6 font-sans leading-relaxed">
              Replica ufficiale da collezione finemente rifinita nei minimi dettagli. Perfetto per la scrivania di ogni appassionato di aviazione.
            </p>

            <div className="space-y-2 text-[10px] border-t border-slate-950 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Materiale</span>
                <span className="text-slate-300 font-bold truncate max-w-[180px]">{collectible.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dettagli Ruote</span>
                <span className="text-slate-300">Carrello in gomma girevole</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Piedistallo</span>
                <span className="text-emerald-500">Incluso nel box</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-slate-500 text-[10px]">Prezzo Suggerito</span>
              <span className="text-lg font-black text-white font-mono">{collectible.price}€</span>
            </div>

            <a
              href={collectible.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
            >
              🛒 Verifica su Amazon.it
            </a>
          </div>
        </div>

        {/* CARD 2: SIMULATORE ADD-ON SPONSORSHIP */}
        <div
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between transition-all duration-350 hover:border-purple-500/30 hover:bg-slate-900/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.05)] overflow-hidden group"
        >
          {/* Neon Gradient Overlay on Hover */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-950/30 border border-purple-800/30">
                Flight Sim Expansion
              </span>
              <span className="text-[10px] text-slate-500 font-bold">Study Level</span>
            </div>

            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 group-hover:text-purple-400 transition-colors">
              {sim.dev} {modelName}
            </h4>
            <p className="text-[11px] text-slate-400 mb-6 font-sans leading-relaxed">
              Vola ai comandi di questo velivolo con la simulazione dei sistemi più complessa sul mercato per PC.
            </p>

            <div className="space-y-2 text-[10px] border-t border-slate-950 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Sviluppatore</span>
                <span className="text-slate-300 font-bold">{sim.dev}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Piattaforme</span>
                <span className="text-slate-300 truncate max-w-[180px]">{sim.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fedeltà Sistemi</span>
                <span className="text-purple-400 font-bold">{sim.type}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-slate-500 text-[10px]">Licenza Sim</span>
              <span className="text-lg font-black text-white font-mono">~{sim.price}€</span>
            </div>

            <button
              onClick={() => alert(`Stai per essere reindirizzato al portale dello sviluppatore ${sim.dev} in modalità protetta.`)}
              className="block w-full text-center text-[10px] font-black uppercase tracking-widest py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 cursor-pointer"
            >
              ✈️ Sblocca sul Sim Store
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
