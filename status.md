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