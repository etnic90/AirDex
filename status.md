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
- Non ancora implementato (Pianificato per il Giorno 5).