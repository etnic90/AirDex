"use client";

import React, { useState } from "react";

type DocSection = "overview" | "database" | "formatting" | "images";

export default function AdminDocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("overview");

  return (
    <div className="space-y-6 text-slate-100 font-sans max-w-6xl">
      {/* Intestazione */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
          📖 MANUALE DI BORDO
        </h1>
        <p className="text-slate-400 font-mono text-xs uppercase mt-1">
          Documentazione interna dello sviluppatore e manuale delle regole di qualità dati
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigazione Documentazione */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-black mb-2">Sezioni</span>
          <button
            onClick={() => setActiveSection("overview")}
            className={`w-full text-left py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSection === "overview"
                ? "bg-slate-900 border-slate-700 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            🚀 Panoramica Progetto
          </button>
          <button
            onClick={() => setActiveSection("database")}
            className={`w-full text-left py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSection === "database"
                ? "bg-slate-900 border-slate-700 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            🗄️ Struttura Database
          </button>
          <button
            onClick={() => setActiveSection("formatting")}
            className={`w-full text-left py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSection === "formatting"
                ? "bg-slate-900 border-slate-700 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            ✍️ Regole Inserimento & i18n
          </button>
          <button
            onClick={() => setActiveSection("images")}
            className={`w-full text-left py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              activeSection === "images"
                ? "bg-slate-900 border-slate-700 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            📸 Workflow Asset & RLS
          </button>
        </div>

        {/* Contenuto Documentazione */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 space-y-6 relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-45" />

          {/* SEZIONE 1: PANORAMICA PROGETTO */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>🚀</span> PANORAMICA DEL PROGETTO
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  <strong>AirDex</strong> è una piattaforma web interattiva stile &quot;Pokedex&quot; dedicata alla catalogazione e scoperta dell&apos;aviazione civile e commerciale. Consente agli appassionati di aviazione (AvGeeks) e spotter di esplorare aerei, compagnie aeree e aeroporti del mondo, confrontarne le prestazioni tecnologiche in plancia olografica e tenere traccia degli avvistamenti e voli effettuati.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl space-y-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Tecnologie Core</h3>
                  <ul className="text-xs text-slate-400 space-y-2 font-mono list-disc list-inside">
                    <li><strong>Framework:</strong> Next.js 15 (App Router)</li>
                    <li><strong>Database:</strong> Supabase PostgreSQL</li>
                    <li><strong>Localizzazione:</strong> next-intl (IT, EN, ES, FR)</li>
                    <li><strong>Styling:</strong> Tailwind CSS</li>
                    <li><strong>Linguaggio:</strong> TypeScript</li>
                  </ul>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl space-y-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Architettura di Routing</h3>
                  <ul className="text-xs text-slate-400 space-y-2 font-mono list-disc list-inside">
                    <li>`/` : Home page dinamica</li>
                    <li>`/[lang]/aircraft/[id]` : Scheda tecnica aereo</li>
                    <li>`/[lang]/airlines/[id]` : Profilo flotta e hub</li>
                    <li>`/[lang]/airports/[id]` : Telemetria scalo</li>
                    <li>`/[lang]/admin` : Pannello di moderazione ed editing</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-950/10 border border-amber-900/30 text-amber-200 p-5 rounded-xl text-xs space-y-2 leading-relaxed">
                <p className="font-mono font-bold uppercase text-amber-400">💡 Filosofia della UI/UX:</p>
                <p className="text-slate-300">
                  L&apos;estetica di AirDex si ispira ai computer di bordo dei cockpit aeronautici ed elementi sci-fi. Utilizza una palette scura ardesia/nero (`slate-950`), bordi sottili e netti, font monospazio per i dati tecnici (`JetBrains Mono`), gradienti metallici fluidi e indicatori cromatici dipendenti dalla rarità dell&apos;aereo (es. Comune: Verde, Leggendario: Giallo/Ambra).
                </p>
              </div>
            </div>
          )}

          {/* SEZIONE 2: STRUTTURA DATABASE */}
          {activeSection === "database" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>🗄️</span> STRUTTURA DEL DATABASE CLUSTER
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  Il database PostgreSQL ospitato su Supabase è strutturato per massimizzare l&apos;indicizzazione e la navigazione circolare tra i record. Di seguito sono elencate le tabelle principali con il loro schema fisico:
                </p>
              </div>

              <div className="space-y-6">
                {/* AEREI */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    ✈️ Tabella: <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">aircraft_models</span>
                  </h3>
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-white font-bold">
                          <th className="p-3">Colonna</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Descrizione / Vincoli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="p-3 text-white font-bold">id</td>
                          <td className="p-3">uuid</td>
                          <td className="p-3">Chiave Primaria</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">manufacturer_id</td>
                          <td className="p-3">uuid</td>
                          <td className="p-3">Foreign Key a `manufacturers.id`</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">model_name</td>
                          <td className="p-3">text</td>
                          <td className="p-3">Nome commerciale (es. `A350-900`)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">house_livery_url</td>
                          <td className="p-3">text</td>
                          <td className="p-3">URL foto standard (su Supabase Storage)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">trivia</td>
                          <td className="p-3">jsonb</td>
                          <td className="p-3">Array JSON di 3 stringhe aneddotiche</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">extended_stats</td>
                          <td className="p-3">jsonb</td>
                          <td className="p-3">Oggetto JSON contenente velocità, quota e spinta</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">image_needs_review</td>
                          <td className="p-3">boolean</td>
                          <td className="p-3">Impostare a `true` per forzare la revisione dell&apos;immagine</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* COMPAGNIE */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    🏢 Tabella: <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">airlines</span>
                  </h3>
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-white font-bold">
                          <th className="p-3">Colonna</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Descrizione / Vincoli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="p-3 text-white font-bold">id</td>
                          <td className="p-3">uuid</td>
                          <td className="p-3">Chiave Primaria</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">name</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">Nome del vettore (es. `Qatar Airways`)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">iata_code / icao_code</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">Codici IATA (2 char) / ICAO (3 char)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">logo_url</td>
                          <td className="p-3">text</td>
                          <td className="p-3">Logo localizzato su Supabase Storage</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">history</td>
                          <td className="p-3">text</td>
                          <td className="p-3">Profilo storico di default (Inglese)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AEROPORTI */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    🌍 Tabella: <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">airports</span>
                  </h3>
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-white font-bold">
                          <th className="p-3">Colonna</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Descrizione / Vincoli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="p-3 text-white font-bold">id</td>
                          <td className="p-3">uuid</td>
                          <td className="p-3">Chiave Primaria</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">name / iata_code / icao_code</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">Nome dello scalo, codici IATA, ICAO</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">runway_details</td>
                          <td className="p-3">text</td>
                          <td className="p-3">Stringa dettagliata piste con orientamento magnetico</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-white">ground_services_json</td>
                          <td className="p-3">jsonb</td>
                          <td className="p-3">Servizi a terra disponibili nello scalo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEZIONE 3: REGOLE INSERIMENTO & LOCALIZZAZIONE */}
          {activeSection === "formatting" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>✍️</span> REGOLE DI INSERIMENTO DATI & LOCALIZZAZIONE
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  Per mantenere un livello elevato di coerenza stilistica e garantire l&apos;internazionalizzazione corretta, l&apos;inserimento dei dati deve seguire rigorosamente queste linee guida:
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-3 text-xs leading-relaxed">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">🇺🇳 Sistema di Localizzazione (next-intl)</h3>
                  <p className="text-slate-300">
                    Ogni tabella core ha colonne dedicate per la traduzione dei testi estesi in quattro lingue (Italiano, Inglese, Spagnolo, Francese).
                  </p>
                  <ul className="text-slate-400 space-y-2 font-mono pl-4 list-disc">
                    <li><strong>Aerei:</strong> Utilizzare `description_it`, `description_en`, `description_es`, `description_fr` (limite di 50 parole per scheda).</li>
                    <li><strong>Compagnie:</strong> Utilizzare `history_it`, `history_en`, `history_es`, `history_fr` (strutturata in sezioni separate da un a capo per un totale di circa 200 parole).</li>
                    <li><strong>Aeroporti:</strong> Utilizzare `history_it`, `history_en`, `history_es`, `history_fr`.</li>
                  </ul>
                  <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 rounded-lg">
                    📌 <strong>Meccanismo di Fallback:</strong> Se una traduzione specifica (es. `description_es`) è vuota, il frontend esegue automaticamente il fallback sulla colonna predefinita senza prefisso (`description`) o sul testo in inglese (`description_en`).
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-3 text-xs leading-relaxed">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">📐 Unità di Misura e Standard</h3>
                  <ul className="text-slate-450 space-y-2 font-mono list-decimal pl-4">
                    <li><strong>Autonomia (Range):</strong> Inserire rigorosamente in chilometri (km).</li>
                    <li><strong>Altitudine / Elevazione:</strong> Inserire in piedi (ft) per l&apos;aviazione civile.</li>
                    <li><strong>Spinta Motori:</strong> Espressa in chilonewton (kN) all&apos;interno del JSON `extended_stats`.</li>
                    <li><strong>Coordinate:</strong> Salvare in formato DMS (Gradi, Minuti, Secondi) o in formato decimale standard.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SEZIONE 4: WORKFLOW ASSET & SICUREZZA */}
          {activeSection === "images" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>📸</span> WORKFLOW DELLE IMMAGINI E SICUREZZA RLS
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  Le immagini rappresentano l&apos;asset grafico principale di AirDex. Per non dipendere da link esterni soggetti a rottura o blocchi di referral, tutte le immagini devono essere caricate su Supabase Storage.
                </p>
              </div>

              <div className="space-y-5">
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-3 text-xs leading-relaxed">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">🛡️ Row-Level Security (RLS)</h3>
                  <p className="text-slate-300">
                    Il bucket `aircraft_images` di Supabase Storage e le tabelle del database sono protetti da politiche RLS per evitare accessi in scrittura non autorizzati:
                  </p>
                  <ul className="text-slate-400 space-y-1.5 pl-4 list-disc font-mono">
                    <li><strong>Lettura:</strong> Consentita pubblicamente a tutti gli utenti anonimi.</li>
                    <li><strong>Scrittura / Aggiornamento:</strong> Consentita solo agli utenti amministratori autenticati (ruolo `service_role` o policy specifiche).</li>
                  </ul>
                  <p className="text-slate-300 mt-2">
                    Durante l&apos;esecuzione di script massivi offline (es. `localAircraftImageSync.mjs`), lo script si connette come superuser per bypassare temporaneamente le restrizioni, ripristinandole automaticamente in chiusura.
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-3 text-xs leading-relaxed">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-amber-500">🚩 Workflow di Revisione e Segnalazione</h3>
                  <p className="text-slate-300">
                    Se un utente o un admin identifica un&apos;immagine errata, non inerente o a bassa risoluzione:
                  </p>
                  <ol className="text-slate-400 space-y-2 pl-4 list-decimal font-mono">
                    <li>Viene impostato il campo `image_needs_review` a `true` nel record della tabella.</li>
                    <li>Il record compare immediatamente nella sezione **&quot;Revisione Immagini&quot;** della dashboard amministrativa.</li>
                    <li>L&apos;admin può sostituire l&apos;immagine caricando un nuovo file (tramite upload diretto che converte l&apos;asset in formato WebP compressa) o inserendo un URL alternativo.</li>
                    <li>Una volta completato, l&apos;admin clicca su **&quot;Segna come Risolto&quot;**, impostando `image_needs_review` a `false` e aggiornando il DB.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
