"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  type: string;
  welcomeBonus: string;
  annualFee: string;
  multiplierFlights: number;
  multiplierEveryday: number;
  perks: string[];
  colorClass: string;
  glowClass: string;
  logo: string;
}

const CARDS: CreditCard[] = [
  {
    id: "galaxy-gold",
    name: "Galactic Gold Card",
    issuer: "American Express (Simulated)",
    type: "Premium Charge Card",
    welcomeBonus: "50,000 Miles",
    annualFee: "250€",
    multiplierFlights: 3,
    multiplierEveryday: 1.5,
    perks: [
      "Accesso a 1,400+ Airport Lounge",
      "Fast Track nei varchi di sicurezza",
      "Assicurazione volo fino a 1,000,000€",
      "Status Gold Hilton & Marriott"
    ],
    colorClass: "bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 text-slate-950",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.3)] border-amber-400",
    logo: "🪐"
  },
  {
    id: "strato-visa",
    name: "Stratosphere Signature",
    issuer: "Visa (Simulated)",
    type: "Travel Credit Card",
    welcomeBonus: "30,000 Miles",
    annualFee: "95€",
    multiplierFlights: 2,
    multiplierEveryday: 1.2,
    perks: [
      "4 ingressi gratuiti Lounge all'anno",
      "Sconto 15% su voli codeshare AirDex",
      "Nessuna commissione estera",
      "Protezione bagaglio smarrito"
    ],
    colorClass: "bg-gradient-to-br from-cyan-600 via-blue-500 to-indigo-700 text-slate-100",
    glowClass: "shadow-[0_0_30px_rgba(6,182,212,0.3)] border-cyan-400",
    logo: "⚡"
  },
  {
    id: "hangar-mastercard",
    name: "Hangar Club World Elite",
    issuer: "Mastercard (Simulated)",
    type: "Frequent Flyer Card",
    welcomeBonus: "20,000 Miles",
    annualFee: "0€ (Primo anno, poi 49€)",
    multiplierFlights: 1.5,
    multiplierEveryday: 1,
    perks: [
      "Imbarco prioritario Gruppo 2",
      "Accumulo miglia accelerato su partner",
      "Assistenza clienti H24 dedicata",
      "Sconto autonoleggio Hertz 10%"
    ],
    colorClass: "bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 text-slate-200",
    glowClass: "shadow-[0_0_30px_rgba(168,85,247,0.3)] border-purple-500",
    logo: "🛩️"
  }
];

export default function TravelHacksPage() {
  const params = useParams();
  const lang = params?.lang || "en";

  // Calcolatore Miglia
  const [flightSpend, setFlightSpend] = useState(200);
  const [everydaySpend, setEverydaySpend] = useState(800);

  // Sfida Instadamento Miglia
  const [selectedRouteOption, setSelectedRouteOption] = useState<string | null>(null);
  const [challengeChecked, setChallengeChecked] = useState(false);
  const [challengeCorrect, setChallengeCorrect] = useState(false);

  const calculateYearlyMiles = (card: CreditCard) => {
    const flightYearly = flightSpend * 12 * card.multiplierFlights;
    const everydayYearly = everydaySpend * 12 * card.multiplierEveryday;
    const bonus = parseInt(card.welcomeBonus.replace(/,/g, ""));
    return Math.round(flightYearly + everydayYearly + bonus);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden font-mono">
      {/* Sfondo Radiale Sci-Fi */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.05),transparent)] pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigazione */}
        <div className="mb-8 flex justify-between items-center">
          <Link href={`/${lang}/pro`} className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 hover:text-cyan-400 border border-slate-900 hover:border-slate-800 bg-slate-950 px-4 py-2 rounded-lg transition-all shadow-md">
            &larr; Indietro al Terminale PRO
          </Link>
          <span className="text-[10px] text-amber-500 tracking-widest uppercase animate-pulse">
            ★ PRO EXCLUSIVE PORTAL
          </span>
        </div>

        {/* Header Sezione */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] tracking-widest uppercase mb-4">
            ✈️ AvGeek Travel Hacks & Rewards
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-3">
            Strategia Accumulo Miglia
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            Massimizza ogni centesimo speso per finanziare la tua passione aeronautica. Confronta le migliori carte di credito co-branded e simula l'accumulo miglia annuale.
          </p>
        </div>

        {/* 1. SEZIONE INTERATTIVA: CALCOLATORE MIGLIA */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-md mb-12 shadow-2xl">
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
            Simulatore Accumulo Miglia 1° Anno
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Input Sliders */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 uppercase">Spese Voli & Hotel (mensile)</span>
                  <span className="text-white font-bold">{flightSpend}€</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={flightSpend}
                  onChange={(e) => setFlightSpend(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 uppercase">Spese Quotidiane & Varie (mensile)</span>
                  <span className="text-white font-bold">{everydaySpend}€</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={everydaySpend}
                  onChange={(e) => setEverydaySpend(Number(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
                />
              </div>

              <div className="text-[10px] text-slate-500 leading-snug border-t border-slate-950 pt-4">
                * La stima del 1° Anno include il Bonus di Benvenuto accumulato al raggiungimento delle soglie di spesa minime.
              </div>
            </div>

            {/* Risultati Dinamici */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CARDS.map((card) => {
                const totalMiles = calculateYearlyMiles(card);
                return (
                  <div key={card.id} className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase mb-1">{card.name}</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">{totalMiles.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500 block uppercase mt-0.5">Miglia totali</span>
                    </div>
                    <div className="mt-4 border-t border-slate-900 pt-3 text-[10px]">
                      <span className="text-slate-400 block">Valore Stimato</span>
                      <span className="text-white font-bold">~{(totalMiles * 0.012).toFixed(0)}€ in Voli</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* INTERACTIVE WEEKLY CHALLENGE */}
        <div className="bg-slate-900/30 border border-purple-900/40 rounded-3xl p-6 md:p-8 backdrop-blur-md mb-12 relative overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.02)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/2 rounded-full blur-xl"></div>
          <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚡</span> Sfida Mensile Route Master (Simulata)
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
            Risolvi il rompicapo di instradamento frequent flyer di questo mese: qual è la rotta che massimizza le miglia Star Alliance per la tratta Milano (MXP) a Tokyo (NRT)?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { id: "a", text: "MXP ➔ FRA ➔ NRT con Lufthansa (tariffa Business Standard) • Moltiplicatore 1.5x", correct: false, reason: "Rotta lineare e comoda, ma non massimizza i bonus di scalo." },
              { id: "b", text: "MXP ➔ SIN ➔ NRT con Singapore Airlines (Classe Business Premium) • Moltiplicatore 2.0x e +5.000 miglia stopover", correct: true, reason: "Corretto! Singapore Airlines offre il 200% delle miglia percorse in tariffa Premium e regala 5.000 miglia extra di stopover a Singapore." },
              { id: "c", text: "MXP ➔ ADD ➔ NRT con Ethiopian Airlines (Classe Economy) • Moltiplicatore 1.0x", correct: false, reason: "Rotta economica, ma in Economy il tasso di accumulo è limitato al 100%." },
              { id: "d", text: "MXP ➔ CDG ➔ NRT con Air France • Moltiplicatore 0x", correct: false, reason: "Attenzione! Air France fa parte dell'alleanza SkyTeam, non accumula miglia Star Alliance." }
            ].map((option) => {
              let btnStyle = "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900/20";
              if (challengeChecked) {
                if (option.correct) {
                  btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
                } else if (selectedRouteOption === option.id) {
                  btnStyle = "border-red-500 bg-red-500/10 text-red-400 font-bold";
                } else {
                  btnStyle = "border-slate-900 bg-slate-950 text-slate-600 opacity-40";
                }
              } else if (selectedRouteOption === option.id) {
                btnStyle = "border-purple-500 bg-purple-500/10 text-purple-400 font-bold";
              }

              return (
                <button
                  key={option.id}
                  disabled={challengeChecked}
                  onClick={() => setSelectedRouteOption(option.id)}
                  className={`p-4 rounded-xl border text-left text-xs transition-all font-mono leading-relaxed ${btnStyle}`}
                >
                  <span className="font-bold mr-2">{option.id.toUpperCase()}.</span>
                  {option.text}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-950 pt-6">
            <div>
              {challengeChecked ? (
                <p className={`text-xs font-mono ${challengeCorrect ? "text-emerald-400" : "text-red-400"}`}>
                  {challengeCorrect 
                    ? "✓ Eccellente! Hai sbloccato il Badge simulato: [Star Alliance Route Master]!" 
                    : `✗ Non è la rotta ottimale. Singapore Airlines (B) offriva il rendimento maggiore.`}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Seleziona un'opzione ed effettua il check di rotta per convalidare la telemetria.
                </p>
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              {challengeChecked ? (
                <button
                  onClick={() => {
                    setChallengeChecked(false);
                    setSelectedRouteOption(null);
                    setChallengeCorrect(false);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase"
                >
                  Riprova
                </button>
              ) : (
                <button
                  disabled={!selectedRouteOption}
                  onClick={() => {
                    setChallengeChecked(true);
                    setChallengeCorrect(selectedRouteOption === "b");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 transition-all text-xs font-bold uppercase disabled:opacity-40"
                >
                  Verifica Rotta
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. GRIGLIA CARTE SKEUOMORFICHE */}
        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>💳</span> Dettagli delle Carte Co-Branded
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className={`bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden transition-all duration-350 hover:border-slate-850 hover:scale-[1.01]`}
            >
              <div>
                {/* Visual Card Representation */}
                <div className={`w-full h-40 rounded-xl ${card.colorClass} ${card.glowClass} border p-4 flex flex-col justify-between relative mb-6 font-mono text-slate-950 select-none shadow-md overflow-hidden group`}>
                  {/* Holographic stripes */}
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.15),transparent_60%)] opacity-80 group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold tracking-widest">{card.issuer}</span>
                    <span className="text-xl">{card.logo}</span>
                  </div>
                  
                  <div>
                    <span className="block text-[8px] tracking-widest uppercase opacity-75">CARDHOLDER</span>
                    <span className="block text-xs font-black tracking-wider uppercase">AVGEEK MEMBER</span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-950/20 pt-2 text-[9px]">
                    <span className="font-bold">{card.name}</span>
                    <span className="font-black opacity-80">AirDex Hub</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">{card.type}</span>
                  <h4 className="text-white font-black text-base uppercase">{card.name}</h4>
                </div>

                {/* Dettagli Tariffari */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-3 rounded-xl border border-slate-900 mb-6">
                  <div>
                    <span className="text-slate-500 block uppercase">Quota Annua</span>
                    <span className="text-white font-bold">{card.annualFee}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase">Bonus Welcome</span>
                    <span className="text-emerald-400 font-bold">{card.welcomeBonus}</span>
                  </div>
                </div>

                {/* Vantaggi Speciali */}
                <ul className="space-y-2.5 text-[10px] text-slate-400 mb-8 border-t border-slate-950 pt-4">
                  {card.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">✔</span>
                      <span className="leading-snug">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => alert(`Inizializzazione modulo di richiesta simulato per ${card.name}. Licenza di prova approvata.`)}
                  className="w-full text-center text-[10px] text-slate-950 uppercase tracking-widest font-black py-3 rounded-xl bg-amber-500 hover:bg-amber-400 transition-all font-mono shadow-md"
                >
                  Richiedi Carta
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 3. FOOTER INFO */}
        <div className="border border-slate-900 bg-slate-900/10 p-6 rounded-2xl text-center text-[11px] text-slate-500 max-w-xl mx-auto">
          ⚠️ <strong>Nota di Esclusione Responsabilità:</strong> Tutte le carte di credito, i loghi, i marchi, i rapporti di conversione punti/miglia e i bonus descritti in questo modulo sono simulazioni fittizie create a scopo dimostrativo all'interno della roadmap AirDex e non costituiscono offerte reali o consulenze finanziarie.
        </div>

      </div>
    </main>
  );
}
