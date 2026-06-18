# Aviation Pokedex - Status Document
**Data:** Giorno 1
**Fase Attuale:** Setup Iniziale completato.

## Decisioni Prese:
- MVP focalizzato solo sulla flotta "Emirates" per testare l'infrastruttura.
- Framework: Next.js con App Router (per massimizzare la SEO).
- Styling: Tailwind CSS.
- Linguaggio: TypeScript.
- AI Guidelines: AGENTS.md incluso per ottimizzare il codice generato.

## Stato del Database:
- Non ancora implementato.

## Pacchetti / Comandi eseguiti:
- Inizializzazione Next.js completata.
- Repository Git inizializzato.
- Primo commit ("Primo commit: setup iniziale Next.js completato") eseguito con successo.


**Data:** Giorno 2
**Fase Attuale:** Pulizia codice base e Layout principale.

## Attività Completate:
- Server di sviluppo avviato con successo su localhost:3000.
- Rimozione del boilerplate di Next.js in `src/app/page.tsx`.
- Creazione della UI minima della Homepage tramite Tailwind CSS.
- Salvataggio Git: `Giorno 2: pulizia boilerplate e setup homepage base`.

**Data:** Giorno 3
**Fase Attuale:** Sviluppo Componenti UI statici.

## Attività Completate:
- Creazione della cartella `src/components`.
- Sviluppo del componente base `AircraftCard.tsx` con design gamificato (tag rarità).
- Integrazione del componente in `page.tsx` con un layout a griglia flessibile (`flex gap-6`).
- Salvataggio Git: `Giorno 3: creato componente statico AircraftCard`.

# AirDex - Status Document
**Data:** Giorno 4
**Fase Attuale:** Architettura Routing Multilingua e Naming.

## Decisioni Prese:
- Nome Ufficiale: **AirDex** (unione di Air + Pokedex, professionale e immediato).
- Architettura: Supporto i18n nativo tramite cartella dinamica `[lang]`.
- Rendering: Implementato il pattern **Asynchronous Server Components** per gestire i parametri dell'URL (params) nelle nuove versioni di Next.js.

## Attività Completate:
- Creazione della rotta dinamica `src/app/[lang]`.
- Spostamento e refactoring di `page.tsx` per supportare la variabile di lingua.
- Risoluzione bug del parametro vuoto tramite `async/await` su `params`.
- Homepage ora funzionante su URL dinamici (es. `/en`, `/it`).
- Salvataggio Git: `Giorno 4: fix rendering asincrono [lang] e naming AirDex`.

## Stato del Database:
- Password DB: Yx%Acx3&+i4ezU,

**Data:** Giorno 5
**Fase Attuale:** Data Strategy & Database Setup.

## Decisioni Prese:
- Stack DB: **Supabase (PostgreSQL)** scelto per robustezza e integrazione Next.js.
- Sicurezza: Credenziali isolate nel file protetto `.env.local`.
- Schema SQL: Tabella `aircrafts` inizializzata con supporto a rarità e dati tecnici.

## Attività Completate:
- Creazione progetto "AirDex" su Supabase.
- Installazione client: `npm install @supabase/supabase-js`.
- Configurazione variabili d'ambiente in `.env.local`.
- Tabella `aircrafts` creata con successo e popolata con il primo aereo (Emirates A380-800).
- Salvataggio Git: `Giorno 5: installato supabase-js, configurato .env e creato schema DB`.

**Data:** Giorno 6
**Fase Attuale:** Connessione Backend-Frontend.

## Attività Completate:
- Creazione del file `src/lib/supabase.ts` per istanziare il client Supabase.
- Modifica della Homepage (`page.tsx`) per eseguire la prima query Server-Side: `.from('aircrafts').select('*')`.
- Implementazione del rendering dinamico: la UI ora genera le card in base al numero di record presenti nel DB.
- Salvataggio Git: `Giorno 6: creato supabase client e query per leggere aerei nella homepage`.

**Data:** Giorno 7
**Fase Attuale:** Componenti Dinamici e Tipizzazione dati.

## Decisioni Prese:
- Gestione Dati: Creato file centralizzato `src/types/index.ts` per l'interfaccia `Aircraft` speculare al DB.
- UI Gamificata: Il colore del badge rarità viene calcolato dinamicamente nel componente (es. Amber per LEGENDARY).

## Attività Completate:
- Creazione del tipo `Aircraft` in TypeScript.
- Refactoring di `AircraftCard.tsx` per accettare ed esporre dati dinamici tramite React Props.
- Aggiornamento del loop in `page.tsx` per passare l'oggetto `aircraft` estratto da Supabase.
- Salvataggio Git: `Giorno 7: definiti tipi TypeScript e rese dinamiche le AircraftCard con le props`.

**Data:** Giorno 8
**Fase Attuale:** Programmatic SEO e Pagine di Dettaglio.

## Attività Completate:
- Popolamento DB: Inseriti 3 nuovi aerei della flotta Emirates tramite SQL.
- Creazione rotta dinamica annidata: `src/app/[lang]/aircraft/[id]/page.tsx`.
- Implementazione query al DB per ID tramite `supabase.from().eq('id', id).single()`.
- Creazione Layout UI per la scheda tecnica del singolo aereo.
- Salvataggio Git: `Giorno 8: popolato DB e creata rotta dinamica per singolo aereo (SEO base)`.

**Data:** Giorno 9
**Fase Attuale:** Gamification & Autenticazione (Fase 3).

## Attività Completate:
- Iniziata l'implementazione del modulo di Auth.
- Creata la pagina `src/app/[lang]/login/page.tsx` utilizzando la direttiva `"use client"`.
- Interfacciato il frontend con i metodi `supabase.auth.signUp` e `supabase.auth.signInWithPassword`.
- Creato componente UI per il form di accesso e registrazione.
- Salvataggio Git: `Giorno 9: creata pagina di login/registrazione con Supabase Auth`.

**Data:** Giorno 10
**Fase Attuale:** Gamification & Autenticazione (Fase 3).

## Decisioni Prese:
- Gestione Rate Limit: A causa delle restrizioni del piano gratuito Supabase (Email limit/IP limit), si è optato per il bypass del signup pubblico tramite la creazione manuale dell'utente direttamente nel database (Backend).
- UX Navigazione: Utilizzato `window.location.assign()` per l'hard redirect post-login, garantendo il caricamento corretto della sessione.

## Attività Completate:
- Corretto bug del "refresh fantasma" nel form di login implementando `type="button"` e `e.preventDefault()`.
- Blindata la rotta `profile/page.tsx` con logica di verifica sessione Server-to-Client.
- Test di autenticazione, reindirizzamento e persistenza sessione superato con successo tramite utente admin.
- Salvataggio Git: `Giorno 10: bypass rate limit Supabase, fix form login e auth guard profilo completato`.

**Data:** Giorno 11
**Fase Attuale:** Restyling UI/UX (Fase 4).

## Decisioni Prese:
- Stile Visivo: Abbandonato il design basic in favore di un'estetica "Observatory Sci-Fi" (Glassmorphism, colori ardesia scuri, accenti luminosi basati sulle rarità).
- Risoluzione Bug: Sostituiti colori custom non riconosciuti da Tailwind con la palette nativa (amber, purple, blue) per ripristinare la visibilità di Navbar e Badge.

## Attività Completate:
- Risolto errore di Hydration Mismatch eliminando il file `layout.tsx` ridondante nella root.
- Creata `Navbar.tsx` globale con indicatori di rotta attivi.
- Aggiornato `layout.tsx` con font combinati (Inter + JetBrains Mono) e sfondo radiale.
- Rivoluzionato `AircraftCard.tsx` con design olografico e feedback visivi on-hover.
- Salvataggio Git: `Giorno 11: refactoring UI globale stile sci-fi, implementazione layout e colori nativi Tailwind`.

**Data:** Giorno 12
**Stato:** Architettura Database (Fase 5 - Completed).

## Decisioni Prese:
- Migrazione dati dalla tabella 'aircrafts' (piatta) a 'aircraft_models' (relazionale con 'manufacturers').
- Standardizzazione dei tipi su 'AircraftModel' per garantire coerenza tra frontend e DB.
- Risoluzione link rotti tramite integrazione componente 'Link' di Next.js e correzione del passaggio della variabile 'lang'.

## Attività Completate:
- Creazione schema SQL relazionale su Supabase.
- Refactoring delle pagine Home e Dettaglio per interrogare il nuovo database.
- Consolidamento dell'architettura: ora il sistema è coerente e pronto per future espansioni.
- Salvataggio Git: `Giorno 12: migrazione database relazionale, fix routing e allineamento interface enciclopedica`.

**Data:** Giorno 14
**Fase Attuale:** Archiviazione Totale - "Opera Omnia" (Fase 6).

## Decisioni Prese:
- Completamento della "Copertura Storica Totale": Il database ora non è più un simple catalogo di flotte moderne, ma una cronologia completa dell'aviazione civile.
- Inclusione Integrale: Inseriti tutti i modelli significativi a partire dagli albori dell'aviazione (1910) fino ai giorni nostri (2026), garantendo continuità storica.
- Standardizzazione Dati: Ogni modello è stato inserito con metadati completi (first_flight_year, engines, max_passengers, range_km), rendendo il dataset pronto per qualsiasi analisi statistica o storica futura.

## Attività Completate:
- Patch Storica Completa: Inseriti tutti i capisaldi tecnologici: dagli idrovolanti degli anni '30 (Martin M-130, Sikorsky S-42) ai giganti a pistoni post-bellici (DC-6B, Convair CV-340/440), fino ai pilastri dell'era jet pionieristica (Il-18D) e moderna.
- Integrazione Industria Italiana: Catalogazione completa dei modelli civili Aermacchi (M.20, M.B.308, M.B.320, AL-60B), colmando la lacuna storica del settore nazionale.
- Audit e Validazione: Eseguita query di controllo decennale: il database presenta ora una distributione coerente di circa 450 modelli, coprendo con precisione ogni decade dal 1910 al 2026.
- Documentazione: Consolidato il repository con la struttura necessaria per l'analisi avanzata (AeroAnalyzer).
- Salvataggio Git: `Giorno 14: completata copertura storica totale 1910-2026, inseriti modelli civili Aermacchi e validazione dati`.

**Data:** Giorno 15
**Fase Attuale:** AirDex Admin Console (Fase 6.1)

## Attività Completate:
- Installazione di `@supabase/ssr` per gestione sessioni via cookie.
- Implementato `src/middleware.ts` con logica di protezione (Auth Guard).
- Configurato matcher per escludere assets statici e ottimizzare le performance.
- Salvataggio Git: `Giorno 15: setup middleware e protezione rotte admin`.

**Data:** Giorno 15 (Completamento)
- Risolto disallineamento tra localStorage e cookie utilizzando `createBrowserClient` di `@supabase/ssr` in `login/page.tsx`.
- L'accesso all'area `/admin` è ora completamente protetto e funzionante per l'utente amministratore designato.
- Salvataggio Git: `Giorno 15: risolto disallineamento auth client-server usando ssr e completato setup admin guard`.

**Data:** Giorno 15 (Completamento Step 3)
- Sviluppata tabella interattiva `QuickEditor` per la gestione massiva dei record.
- Implementato sistema di ordinamento dati multi-chiave (lato client).
- Integrata UI di ritaglio olografica tramite `react-easy-crop` (standard 16:9).
- Configurato upload directo su Supabase Storage con conversione automatica in WebP ad alta qualità.
- Salvataggio Git: `Giorno 15: completato Quick Editor con ordinamento client-side e WebP crop inline`.

**Data:** Giorno 16
**Fase Attuale:** Discovery & Advanced Filtering (Fase 7).

## Decisioni Prese:
- Architettura Homepage: Transizione verso un'interfaccia "Sci-Fi / Cockpit" ad alto impatto visivo.
- Ottimizzazione Performance: Abbandonato il caricamento massivo dell'intera flotta in Home per evitare colli di bottiglia futuri (con 2.000+ record).
- Routing Ricerca: Il form di ricerca in Home punta direttamente tramite metodo GET alla rotta `/radar`, precaricando l'URL prima ancora dell'inizializzazione del client JavaScript.

## Attività Completate:
- Sviluppata la nuova "Main Terminal" (Homepage) con statistiche aggregate in tempo reale tramite query Supabase ottimizzate (`count: "exact"`).
- Implementato il modulo "Aereo del Giorno" dinamico (pesca da tier Epic/Legendary) con progress bar olografiche per range e capienza.
- Aggiunta sezione "Navigatore Ere Storiche" con query string pronte per il radar (es. `?era=jetage`).
- Ottimizzata la griglia "Ultime Aggiunte" limitando la query DB agli ultimi 3 record inseriti.
- Salvataggio Git: `Giorno 16: refactoring completo Homepage stile Sci-Fi con telemetria live e ottimizzazione query`.

**Data:** Giorno 17
**Fase Attuale:** Discovery & Advanced Filtering (Fase 7 - Completata).

## Attività Completate:
- Sviluppata rotta dinamica `/radar` (Radar Centrale) con architettura ibrida Server/Client tramite `<Suspense>`.
- Implementato `RadarClient` per il filtraggio incrociato lato client (Testo, Status, Rarità, Epoca) ad alte prestazioni tramite `useMemo`.
- Creato componente standalone `<SearchAutocomplete>` per la Homepage, con dropdown predittivo e intercettazione parametri URL.
- Ottimizzato layout Grid a 3 colonne su schermi larghi (1600px) per ospitare le card senza distorsioni visive.
- Salvataggio Git: `Giorno 17: completata Fase 7 con Radar Centrale, filtri live e motore predittivo olografico`.

**Data:** Giorno 18
**Fase Attuale:** AI Data Enrichment & Automated Image Sourcing (Fase 8).

## Decisioni Prese:
- Motore AI di Crociera: Stabilizzato l'arricchimento descrittivo di massa su `gemini-2.5-flash` tramite il nuovo SDK `@google/genai` per bypassare i blocchi regionali e la deprecazione silente dei vecchi modelli (404/429 su versioni legacy e lite).
- Strategia di Batching: Elaborazione strutturata a lotti condizionali (`.is('description', null)`) per consentire la ripartenza istantanea e indolore dello script in caso di saturazione delle quote gratuite.
- Architettura Fotografica: Scelta strategica di popolare in blocco la colonna `house_livery_url` tramite *hotlinking* diretto in alta risoluzione (1000px) estratti dalle API native di Wikipedia (`generator=search`), tutelando lo spazio del bucket Supabase e garantendo l'assoluta compatibilità con l'override manuale del Quick Editor.
- Protocollo Anti-Singhiozzo: Implementato un ciclo ferreo di "Insistenza a 15 tentativi" per singolo record per abbattere i falsi negativi causati dai timeout temporanei dei server Wikimedia.

## Attività Completate:
- Sviluppato lo script Node `scripts/enrichAircraft.mjs` con modulo di raffreddamento d'emergenza automatico a 60 secondi per assorbire i colli di bottiglia dell'API di Google.
- Sviluppato lo script Node `scripts/fetchImages.mjs` (Generazione 3) con autenticazione via `User-Agent` per superare i firewall di Wikipedia e telemetria live in tempo reale sul terminale (`[Index/Total]`).
- Completata con successo la copertura visiva e testuale della quasi totalità della flotta storica del database, isolando i modelli ultra-rari tramite flag `NOT_FOUND_WIKI` per la rifinitura e il crop manuale.
- Salvataggio Git: `feat(database): completato arricchimento flotta e integrazione immagini` eseguito con successo per blindare il backend.

**Data:** Giorno 19
**Fase Attuale:** Ottimizzazione Asset e Stabilizzazione Tecnica (Fase 8 - Completata).

## Decisioni Prese:
- Gestione Immagini: Implementato un fallback skeuomorfico (ologramma + scansione radar) per proteggere la UI dai record mancanti (`NOT_FOUND_WIKI`).
- Data Cleaning: Sanitizzate le descrizioni e i trivia generati dall'AI, rimuovendo markdown residuo e tag HTML tramite script regex ottimizzato.
- Performance DB: Creati indici PostgreSQL B-Tree nativi su Supabase (`model_name`, `manufacturer_id`, `rarity`) per garantire latenze minime nei filtri del Radar.
- Error Handling: Abbandonate le pagine di errore di default in favore di Error Boundaries skeuomorfici (404 "Segnale Radar Perso" e 500 "Avaria di Sistema") per Next.js App Router.
- Types: Aggiornata l'interfaccia `AircraftModel` per supportare i nuovi campi AI (`era`, `description`, `trivia`, `extended_stats`).

## Attività Completate:
- Sviluppato e integrato il fallback visivo in `AircraftCard.tsx`.
- Creato ed eseguito con successo `scripts/sanitizeTexts.mjs`.
- Eseguite query SQL di indicizzazione su Supabase.
- Creati `not-found.tsx` ed `error.tsx` nella root dell'App Router.
- Salvataggio Git: `feat(fase-8): completata ottimizzazione asset, sanitizzazione AI, indici DB e error boundaries skeuomorfici`.

Data: Giorno 20
Fase Attuale: SEO Programmatico e Stabilità Routing (Fase 9 - Completata).

Decisioni Prese:
Architettura Routing: Migrata la struttura verso un approccio "piatto" all'interno di src/app/[lang]/ per garantire compatibilità nativa con next-intl e middleware di routing.

Ottimizzazione Compilazione: Sostituito Turbopack con Webpack in fase di build (npx next dev --no-turbo) e pulizia forzata della cache per risolvere i conflitti di build (ENOENT, MODULE_NOT_FOUND).

Strategia SEO: Implementazione del Programmatic SEO tramite generateStaticParams per pre-generare staticamente (SSG) tutte le 1.687 schede aereo, garantendo massima indicizzazione.

Metadata Dinamici: Implementazione di generateMetadata su base ID per titoli e descrizioni univoche per ogni pagina di dettaglio.

Gestione Risorse: Risolto conflitto di path critico per i file di localizzazione JSON tramite process.cwd() per garantire la portabilità tra ambienti di sviluppo e produzione.

Attività Completate:
Refactoring globale degli import con alias @/ per eliminare errori di path relativi.

Configurazione Middleware: Spostato middleware.ts nella root di src/ e configurato per la gestione corretta dei prefissi di lingua.

Implementazione generateMetadata dinamico in page.tsx con handling sicuro per il campo manufacturer (evitato errore never).

Test di Build: Build di produzione (npm run build) verificata con successo: 1.687 pagine statiche generate correttamente.

Risoluzione Bug: Correzione firme asincrone (params: Promise<{...}>) su Layout e Page per conformità con Next.js 16+.

Salvataggio Git: Giorno 20: completata fase 9, routing stabile, SEO programmatico implementato e build di produzione verificata.

Il sistema è ora pronto e ottimizzato. Abbiamo una base solida, performante e pronta per l'indicizzazione.


**Data:** Giorno 21
**Fase Attuale:** Nuove Pagine Core & Data Discovery (Fase 10 - Completata).

## Decisioni Prese:
- Libreria Grafica: Adozione di `recharts` per la renderizzazione fluida e reattiva dei grafici olografici (Radar, Bar, Pie) integrati nell'ecosistema Next.js.
- UX Ricerca: Abbandonati i classici `<select>` nativi nell'Hangar di Comparazione in favore di un componente custom `AircraftAutocomplete` con ricerca predittiva in tempo reale, per gestire agilmente oltre 450 record.
- Architettura Layout: Refactoring della `Navbar` globale, passata da un contenitore rigido a un layout fluido (`w-full`) per allinearsi perfettamente alle interfacce espansive del Radar e della Telemetria.
- Gamification Audio: Sospesa l'implementazione dei micro-suoni UI per il web, rimandando la feature a un futuro porting mobile (app nativa) per evitare blocchi autoplay dei browser e frizioni UX.

## Attività Completate:
- Installazione libreria `recharts`.
- Sviluppata la rotta `src/app/[lang]/compare/page.tsx` (Hangar di Comparazione) con Radar Chart a ragnatela normalizzato su base 100 e tabella tecnica di confronto.
- Sviluppata la rotta `src/app/[lang]/stats/page.tsx` (Global Telemetry) con calcolo aggregato lato client (`useMemo`) di KPI globali, distribuzioni storiche e dominance dei costruttori.
- Aggiornato `src/components/Navbar.tsx` con logo a gradiente metallico, nuovi link di navigazione e margini fluidi sincronizzati.
- Salvataggio Git: `Giorno 21: completata fase 10 con compare, stats e navbar fluida`.

Data: Giorno 48
Fase Attuale: Espansione dell'Ecosistema (Fase 11 - Completata).

Decisioni Prese:
Navigazione Circolare: Chiuso il "triangolo logistico" interattivo (Aereo -> Compagnia -> Aeroporto e viceversa), permettendo all'utente di navigare senza mai interrompere il flusso.

UX/UI Premium e Antiproiettile: Abbandonato il CSS Grid standard in favore di un layout asimmetrico (Bento Box) basato su Flexbox a percentuali assolute (2/3 e 1/3). Questo ha eliminato i bug di "Grid Blowout" causati da stringhe non formattate (es. METAR e dettagli piste).

Dettagli Visuali: Sviluppato un converter interno per tradurre nazioni in codici ISO e visualizzare bandiere SVG ad alta risoluzione con tooltip custom CSS-only.

Attività Completate:
Sviluppata la pagina Indice e Dettaglio del modulo Airlines (Compagnie Aeree) con gestione fallback loghi (Clearbit/Wikipedia).

Sviluppata la pagina Indice e Dettaglio del modulo Airports (Aeroporti) con telemetria, meteo avionico e dati infrastrutturali.

Corretto il parsing asincrono dei params per conformità totale a Next.js 15 in tutte le nuove rotte.

Eseguito commit: feat: completata Fase 11 - Integrazione Aeroporti, Layout Dashboard e Navigazione Circolare.

Sistemi online. Ciao Pilota, ho letto il log. Proseguiamo.

**Data:** Giorno 49
**Fase Attuale:** Content Marketing & Community Building (Fase 12 - Completata).

## Decisioni Prese:
- Integrazione Database Supabase: Sfruttate le tabelle native `articles` e `spotter_uploads` già predisposte per evitare la dipendenza da CMS esterni (come Sanity), garantendo relazioni dirette e performanti nel database di AirDex.
- Storage Locale degli Avvistamenti: Le foto caricate dagli spotter vengono inviate direttamente al bucket Supabase `spotters/uploads/` e rimosse in automatico dallo storage fisico se rifiutate durante la moderazione.
- Separazione dei Componenti: La galleria degli spotter e il modulo di upload interattivo sono stati isolati nel client component `SpotterSection` per mantenere intatta la compilazione statica e le performance SEO (SSG) della pagina di dettaglio dell'aereo.

## Attività Completate:
- Sviluppata la pagina Indice Blog `/blog` e Dettaglio Articolo `/blog/[slug]` con layout premium, supporto SSG e SEO dinamico.
- Sviluppato il componente `SpotterSection` integrato in fondo alle schede aereo per visualizzare le foto approvate e gestire l'invio (upload) in stato `PENDING` di nuovi avvistamenti da parte dei membri della community.
- Sviluppato il pannello admin `/admin/spotters` (Moderazione Spotter) con funzionalità di approvazione e rifiuto (con eliminazione dallo Storage di Supabase).
- Aggiornata la `Navbar` globale (link News, link Compagnie e link Aeroporti) e la sidebar amministrativa `layout.tsx` (link Moderazione Spotter).
- **Integrazione Ecosistema in Homepage**: Inserita una sezione bento-style in `page.tsx` con card dedicate per indirizzare gli utenti direttamente al registro delle Compagnie Aeree (`/airlines`) e degli Aeroporti (`/airports`).
- **SEO Tecnico Avanzato**:
  - Implementati i dati strutturati Schema.org (**JSON-LD** `BlogPosting`) all'interno di ciascun articolo del blog.
  - Sviluppato il file generatore di **Sitemap dinamico** `sitemap.ts` nativo Next.js, mappando tutte le rotte statiche (inclusi `/airlines` e `/airports`) e dinamiche (aerei, compagnie, aeroporti, blog) per ogni lingua supportata.
  - Sviluppato il file **robots.ts** per istruire correttamente i motori di ricerca sull'indicizzazione ed escludere le rotte `/admin` e `/profile`.
- **Espansione Compagnie Aeree**: Inserite nel database **20 nuove compagnie aeree storiche e attive** (es. Air France, British Airways, ITA Airways, TWA, Swissair) con dati reali di flotta, alleanze, hub e codici IATA/ICAO validati per evitare conflitti di chiavi esterne.
- **Localizzazione Loghi Compagnie**: Sviluppato un **modulo di manutenzione loghi client-side** integrato nella dashboard amministrativa `/admin`. Questo modulo permette all'amministratore di scaricare e caricare i loghi in tempo reale direttamente dal browser, bypassando i blocchi DNS e le restrizioni di CORS esterne tramite il proxy **`corsproxy.io`**, salvando i file su Supabase Storage e preservando i formati vettoriali nativi (SVG) e trasparenti (PNG) originali.
- Eseguito test di build di produzione superato con successo: generate correttamente 1721 risorse statiche (inclusi `/sitemap.xml` e `/robots.txt`).

**Data:** Giorno 50
**Fase Attuale:** Localizzazione Automatica dei Loghi via Terminale (Completata).

## Decisioni Prese:
- **Fallback Wikipedia**: Progettata e implementata una ricerca fallback automatica su Wikipedia API se l'URL del logo principale (o Clearbit) non è raggiungibile o restituisce errori.
- **User-Agent Compliant**: Sostituito il classico User-Agent generico da browser con uno specifico e descrittivo (`AviationPokedexLogoSync/1.0`) per rispettare le linee guida sull'uso delle API di Wikipedia, azzerando gli errori `429 Too Many Requests`.
- **Upload su Supabase**: Tutti i loghi scaricati (in formato SVG, PNG, WEBP o JPG) vengono caricati nel bucket Supabase `spotters` sotto il path `airlines/` e il database viene aggiornato con gli URL pubblici permanenti, evitando link rotti o dipendenze esterne.

## Attività Completate:
- Ottimizzazione dello script `scripts/localLogoSync.mjs`.
- Esecuzione dello script e completamento con successo della sincronizzazione di tutti i loghi mancanti delle compagnie aeree civili nel database (18/18 loghi elaborati e caricati con successo nel bucket Supabase).
- Risolti i problemi di DNS ed esecuzione.

**Data:** Giorno 51
**Fase Attuale:** Importazione Globale e Restyling Terminale Compagnie (Completata).

## Decisioni Prese:
- **Espansione Massiva (Wikidata SPARQL)**: Eseguita una query SPARQL completa per importare tutte le compagnie commerciali della storia dell'aviazione che hanno sia un codice IATA sia un codice ICAO. Questo ha inserito nel database ben **2.215 nuove compagnie aeree storiche e attive** del mondo (totale di **2.297 vettori**). Le collisioni di chiavi uniche IATA (es. Sabena/Brussels Airlines `SN`) sono state risolte dinamicamente azzerando il codice per la storica e mantenendo l'ICAO/Nome.
- **Risoluzione Loghi Fair-Use Locale**: Migrata la ricerca dei file dall'API di Wikimedia Commons a quella locale di English Wikipedia (`en.wikipedia.org`). Questo ha permesso di scaricare correttamente sia le immagini su Commons sia i file locali salvati sotto la regola del "fair-use" (come il logo di United Airlines).
- **Risoluzione Loghi Massiva**: Per le 2.215 nuove compagnie, l'URL del logo viene ricavato direttamente convertendo l'indirizzo Wikidata in un redirect Commons Special FilePath. Questo permette di caricare ed esporre oltre 2200 loghi istantaneamente nel browser senza intasare il bucket Supabase locale.
- **Paginazione e Filtri Avanzati**: Implementati controlli dinamici client-side sulla pagina delle compagnie per garantire tempi di risposta istantanei (0ms), con filtri avanzati per Alleanze, Stato e ordinamenti mirati.

## Attività Completate:
- Creazione ed esecuzione dello script di importazione `scripts/importAllAirlinesFromWikidata.mjs`.
- Rilancio dello script definitivo `scripts/localLogoSync.mjs` che ha completato con successo la localizzazione dei loghi originari.
- Riscritto il file [src/app/[lang]/airlines/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/airlines/page.tsx) con una dashboard statistica per AvGeek, barra di ricerca testuale multi-campo, filtri per alleanza/stato, paginazione dinamica e ordinamenti multipli.
- Compilazione e test Next.js superato con successo.

**Data:** Giorno 52
**Fase Attuale:** Sicurezza Consensi, Profilo & Autenticazione Avanzata (Fase 13 - Completata).

## Decisioni Prese:
- **Bypass Limitazione Client Autodelete**: Poiché le client-side API di Supabase non supportano la cancellazione autonoma dell'utente (del record `auth.users`) a causa di restrizioni di sicurezza, è stata registrata una funzione PostgreSQL sicura con privilegi `SECURITY DEFINER` denominata `delete_user_self()`.
- **Integrazione Consensi in DB**: Aggiunte colonne `privacy_accepted` (booleano) e `newsletter_subscribed` (booleano) alla tabella `user_profiles` tramite script di migrazione.
- **Supporto Password in Settings**: Aggiunta la possibilità di impostare o aggiornare la password dal terminale dell'area riservata, offrendo compatibilità e integrazione per gli account creati tramite Google OAuth che desiderano attivare anche l'accesso email tradizionale.
- **UI di Sicurezza (Danger Zone)**: Fornito un modulo a doppio sblocco tramite caselle di controllo obbligatorie per l'eliminazione dell'account, riducendo a zero i rischi di disattivazione involontaria.

## Attività Completate:
- **Database Schema**: Eseguito con successo `scripts/migration_consents.mjs` per aggiungere le colonne relative ai consensi.
- **Registrazione & Login**: Aggiornato [src/app/[lang]/login/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/login/page.tsx) per raccogliere ed inviare i consensi di privacy (obbligatorio) e newsletter (facoltativo) al DB all'atto della registrazione.
- **Impostazioni Profilo (Console)**: Implementato il modulo Impostazioni (Tab ⚙️ Impostazioni) in [src/app/[lang]/profile/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/profile/page.tsx) con tre macro-sezioni:
  - *Aggiornamento Licenza Pilota*: Modifica dinamica di Callsign, Aeroporto Base (dropdown caricato dal DB), Compagnia Preferita (con barra di ricerca ad autocompletamento e loghi inline) e Decennio Storico.
  - *Cambio Password*: Form di sicurezza con validazione di lunghezza e corrispondenza tramite `supabase.auth.updateUser`.
  - *Danger Zone (Smantellamento Hangar)*: Modulo di eliminazione con doppio checkbox di sicurezza che esegue l'RPC `delete_user_self()`, svuotando a cascata le tabelle collegate (`user_captures`, `user_profiles`, ed infine l'account da `auth.users`).
- **Registrazione Database RPC**: Creato ed eseguito lo script `scripts/migration_delete_user.mjs` che registra l'RPC `delete_user_self` con permessi `SECURITY DEFINER`.
- **Test Build**: Eseguito `npm run build` con successo, confermando l'integrità del codice TypeScript/Next.js (1.721 percorsi statici compilati correttamente).

**Data:** Giorno 53
**Fase Attuale:** Cronologia Lineare & Esplorazione Storica (Fase 10 - Completata).

## Decisioni Prese:
- **Navigazione Temporale**: Creazione della nuova rotta `/timeline` interamente dinamica e interattiva, strutturata su client-side query via Supabase per garantire filtri istantanei e prestazioni elevate.
- **Raggruppamento per Ere**: Definizione di 4 macro-ere aeronautiche basate sull'anno di primo volo (`first_flight_year`), coerentemente con i filtri storici già presenti nel Radar Centrale.
- **Integrazione Navigazione Circolare**: Puntamento diretto delle timeline card alle relative pagine di dettaglio aereo `/aircraft/[id]`.

## Attività Completate:
- **Routing & Pagine**: Creata la cartella e il file [src/app/[lang]/timeline/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/timeline/page.tsx) con la timeline olografica suddivisa in epoche, schede storiche ed elenco milestones per ciascuna era.
- **Navbar**: Aggiornato [src/components/Navbar.tsx](file:///C:/wamp64/www/aviation-pokedex/src/components/Navbar.tsx) per integrare il link "Timeline" con indicatori di rotta attivi.
- **Roadmap**: Aggiornato [roadmap.md](file:///C:/wamp64/www/aviation-pokedex/roadmap.md) segnando la Fase 10 come completata.
- **Test Build**: Eseguita compilazione Next.js con successo, confermando l'integrità del routing multilingua per la rotta `/timeline`.

**Data:** Giorno 54
**Fase Attuale:** Espansione Aeroporti & Telemetria di Scalo (Fase 11 - Completata).

## Decisioni Prese:
- **Espansione Aeroporti Globale**: Popolamento massivo della tabella `airports` tramite Wikidata SPARQL importando tutti gli aeroporti civili commerciali passeggeri al mondo aventi sia un codice IATA che ICAO (raggiungendo quota 2.058 aeroporti).
- **Deduplica di Chiavi rigidamente in-memory**: Per evitare blocchi di transazione Postgres dovuti a collisioni IATA/ICAO provenienti da record Wikidata sporchi, il batch inserisce solo record verificati unici in-memory.
- **Dettagli per Appassionati (AvGeek Specs)**: Introduzione di piste dettagliate con orientamento magnetico, dimensioni (m/ft) e livelli ILS (CAT IIIb per atterraggi automatici in nebbia densa), frequenze radio COM e suggerimenti spotter specifici per scalo.
- **Lazy Paging e Filtri in Home Aeroporti**: Aggiunta di filtri avanzati per Nazione (dropdown ricavato live) e Piste operative, con lazy loading a blocchi da 12 elementi per massimizzare la velocità di rendering.

## Attività Completate:
- **Database Importation**: Creato ed eseguito lo script `scripts/importAllAirportsFromWikidata.mjs` inserendo con successo altri 851 aeroporti internazionali.
- **Index UI**: Riscritto [src/app/[lang]/airports/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/airports/page.tsx) integrando filtri avanzati, sorting dinamico e lazy pagination.
- **Details UI**: Riscritto [src/app/[lang]/airports/[id]/page.tsx](file:///C:/wamp64/www/aviation-pokedex/src/app/[lang]/airports/[id]/page.tsx) con piste dettagliate, servizi di terra, coordinate DMS e spotter corner.
- **Test Build**: Eseguito `npm run build` con esito positivo (nessun errore di tipi TypeScript o Next.js).