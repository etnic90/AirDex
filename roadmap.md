---- MASTER ROADMAP ----

FASE 8: Ottimizzazione Asset e Stabilizzazione Tecnica (Giorni 19-22)

Gestione Fallback Immagini: Implementazione di un'immagine segnaposto olografica nel front-end per intercettare i record NOT_FOUND_WIKI ed evitare layout spezzati.

Sanitizzazione Testi: Script Node per rimuovere eventuali refusi di formattazione o tag HTML rimasti nelle descrizioni generate dall'AI.

Database Indexing: Creazione di indici PostgreSQL su Supabase per le colonne più cercate (model_name, manufacturer_id, rarity) per garantire query sotto i 50ms in vista dell'aumento di traffico.

Skeuomorphic Error Boundaries: Pagine di errore 404 e 500 personalizzate con grafica immersiva (es. "Radar offline" o "Sistemi in avaria").

FASE 9: Deep Technical SEO & Internazionalizzazione (Giorni 23-30)

Localizzazione Completa (EN, ES, FR, IT): Configurazione di next-intl per tradurre l'intera UI. Aggiunta di colonne dedicate nel DB (desc_en, desc_es, ecc.).

Programmatic SEO Globale: Configurazione di generateStaticParams per generare staticamente (SSG) a tempo di build le oltre 1.800 URL (450 aerei x 4 lingue).

Sitemap & Robots.ts Dinamici: Script nativo Next.js che interroga Supabase a ogni build per generare la mappa XML aggiornata.

Strutturazione Dati JSON-LD: Iniezione di microdati Schema.org (tipo Vehicle o Product) in ogni pagina per dominare i Rich Snippets su Google.

Dynamic OpenGraph: Creazione di un'API Edge Vercel (api/og) per autogenerare immagini social personalizzate per ogni aereo condiviso.

FASE 10: Nuove Pagine Core & Data Discovery (Giorni 31-38 - Completata)

Hangar di Comparazione (/compare): Interfaccia a doppia colonna con grafici radar olografici sovrapposti per confrontare specifiche tecniche (range, passeggeri) di due velivoli.

Cronologia Lineare (/timeline): Navigazione visiva interattiva che traccia l'evoluzione dal 1910 al 2026.

Global Telemetry Dashboard (/stats): Pagina pubblica con le statistiche della flotta globale.

Filtri di Ricerca Avanzati: Inserimento nel Radar di slider numerici per filtrare in tempo reale per range_km e max_passengers.

Audio Feedback (Toggle): Micro-suoni sci-fi attivabili al click dei filtri e all'apertura delle card.

FASE 11: Espansione dell'Ecosistema (Giorni 39-48)

Modulo Compagnie Aeree (Airlines):

DB: Flotta attuale/storica, codici IATA/ICAO, hub, anno di fondazione.

UI: Pagine di dettaglio con griglia degli aerei in flotta e livree storiche.

Modulo Aeroporti (Airports):

DB: Coordinate, piste, altitudine, traffico annuo.

UI: Pagine aeroporto con le compagnie operative e gli aerei più frequenti.

Navigazione Circolare: Interlink automatico (Aereo -> Chi lo usa -> Dove vola).

FASE 12: Content Marketing & Community Building (Giorni 49-55)

Blog Editoriale (Aviation News): Integrazione CMS Headless (Sanity o Supabase) per articoli SEO-oriented (es. "Differenze tra A350 e 787").

Spotters Network (UGC): Sistema di upload frontend per permettere agli utenti di caricare le proprie foto.

Console di Validazione: Pannello admin per accettare/rifiutare le foto degli utenti e mantenere alta la qualità.

FASE 13: Gamification Avanzata & Onboarding (Giorni 56-65)

Onboarding "Serio": Flusso di registrazione multi-step (scelta aeroporto base, compagnia e decennio preferito) per profilare l'utente.

Collezione Pokedex (Avvistato/Volato): Tabella user_captures nel DB. Pulsanti per registrare aerei o compagnie nella propria bacheca personale.

La Teca (/profile/collection): Griglia dei modelli collezionati con percentuale di completamento dell'AirDex.

Sistema Achievements: Sblocco badge digitali automatici (es. "Pioniere" per aerei storici, "Frequent Flyer").

AeroQuiz (Minigioco): Modalità "Spotter Trainer" con timer e immagini croppate, supportato da classifiche globali (Leaderboard).

FASE 14: Monetizzazione B2C & B2B (Giorni 66-72)

Integrazione Stripe (AirDex PRO):

Free: Pubblicità, quiz limitati.

PRO (es. 3.99€/mese): Zero ads, statistiche avanzate, dark mode esclusiva, badge "Spotter PRO", filtri estremi.

Affiliate Marketing Widget: Inserimento automatico di link affiliati in pagina (modellini Amazon/Revell, fotocamere, add-on MSFS/X-Plane).

Partnership Carte di Credito (Travel Hacks): Landing page dedicate per convertire in CPA (Amex, carte co-branded).

Ads B2B Nativi: Spazi venduti direttamente a compagnie o scuole di volo (es. banner Qatar Airways solo sulle pagine dell'A350).

FASE 15: Sicurezza, Audit e Infrastruttura (Giorni 73-77)

Supabase RLS (Row Level Security): Chiusura ermetica in sola lettura pubblica; scrittura limitata ad Admin.

Testing Cross-Browser & Mobile: Ottimizzazione touch/gesture per le tabelle e i filtri su iOS e Android.

Performance Audit: Intervento su font e compressione per score 100/100 su Lighthouse.

Deployment Finale: Hosting Vercel, custom domain (airdex.com), DNS, SSL e email transazionali.

Go-Live & Tracking: Integrazione Sentry (bug tracking), PostHog o Mixpanel per analisi MAU e tassi di conversione.

FASE 16: Investitori & App Nativa (Giorni 78-85+)

Pitch Deck: Raccolta dati di Traction (utenti, retention) per presentarsi ai VC come "il database vivente dell'aviazione".

Sviluppo React Native / Expo: Porting dell'architettura per iOS e Android usando il backend esistente.

Hardware Features (Mobile):

Push Notifications: Avvisi su aerei rari (con potenziale API ADS-B type Flightradar24).

Fotocamera Nativa: Upload immediato direttamente dalla pista.

Scanner Scanner Boarding Pass: Per sbloccare gli aerei su cui si è appena volato.

Lancio Store: Pubblicazione ufficiale su Apple App Store e Google Play Store.