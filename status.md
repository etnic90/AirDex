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