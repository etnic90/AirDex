# Linee Guida di Ottimizzazione Aeronautica & Case Study: Lockheed L-1011-100

Questo documento raccoglie tutte le modifiche strutturali, grafiche, editoriali e di database applicate al **Lockheed L-1011-100** su richiesta dell'utente. Questa scheda funge da **benchmark ufficiale (Gold Standard)** da replicare aereo per aereo per gli altri velivoli presenti nel database di AirDex.

---

## 1. Riepilogo Modifiche Effettuate (Lockheed L-1011-100)

### A. Ottimizzazione Editoriale & SEO (Testi)
*   **Struttura ad Articolo SEO**: Il testo non è più un unico blocco monolitico. È diviso in paragrafi brevi e leggibili separati da uno spazio vuoto.
*   **Gerarchia dei Contenuti**: Sono stati introdotti sottotitoli di livello 3 (`###`) per scandire le sezioni principali:
    *   `### Contesto Storico & Origini`
    *   `### Architettura & Design Tecnologico`
    *   `### Carriera Operativa & Vettori`
    *   `### Eredità & Impatto Culturale`
*   **Elementi di Lettura Facilitata**: Inclusione di elenchi puntati (`*` o `-`) e grassetti per evidenziare dati tecnici, caratteristiche di spicco e curiosità (es. sistemi Autoland, propulsori, cucine di bordo).
*   **Gestione Rigida del Link-Parser**: Le entità citate non devono contenere link markdown tradizionali `[Nome](url)` poiché il parser personalizzato non li supporta e verrebbero mostrati come testo grezzo. Devono essere racchiusi in doppi asterischi (es. `**Pan American World Airways**`). Il parser `parseInlineFormatting` li intercetterà e genererà automaticamente il link interno corretto.
*   **Nessuna Allucinazione o Testo Non Tradotto**: Le curiosità (Hangar Trivia) e le descrizioni sono verificate e interamente tradotte in italiano (`description_it`), rimuovendo frammenti o descrizioni interamente in inglese.

### B. Gestione Flotta & Operatori Storici (Database)
*   **Stato Storico Coerente**: Trattandosi di un aereo storico non più operativo, la compagnia **Delta Air Lines** è stata spostata dallo stato di flotta `ACTIVE` a quello `HISTORIC`.
*   **Inserimento Operatori Storici Mancanti**: Sono stati inseriti nel database (`airline_fleet`) gli operatori storici leggendari mancanti per il modello con stato `HISTORIC`:
    *   *British Airways*
    *   *TWA (Trans World Airlines)*
    *   *Cathay Pacific*
    *   *Air Canada*
    *   *Saudia*
    *   *LTU International*
*   **Nascondere Sezione Flotta Vuota**: Se un aereo ha 0 operatori attivi in flotta, la sezione **"Vettori Rilevati (Flotta Attiva)"** viene completamente nascosta dal codice JSX per non lasciare spazi vuoti o diciture inutili. Il contenitore principale si mostra solo se è presente almeno una flotta attiva o storica.

### C. Restyling Grafico & UX (Layout e Font)
*   **Dimensione Minima dei Font a 14px**: Tutti i testi descrittivi, i widget degli sponsor, i banner pubblicitari mockup, la sezione archivio spotter e le descrizioni dei pulsanti hanno una grandezza minima di 14px (`text-sm`), garantendo leggibilità superiore su tutti i display.
*   **Loghi Vettori più Grandi e Orizzontali**: I box contenitori dei loghi delle compagnie aeree nelle liste flotta sono stati ingranditi da `w-12 h-12` (quadrati e piccoli) a **`w-24 h-14`** (rettangolari, orizzontali e ampi), assecondando l'aspect ratio naturale dei loghi aziendali delle compagnie.
*   **Risoluzione Limite Emojis su Windows (Bandiere)**: Per superare il limite dei sistemi Windows (che visualizzano le bandiere nazionali emoji come semplici lettere statiche, es. `US`, `GB`), è stata implementata l'integrazione con **FlagCDN**, che carica dinamicamente i file PNG delle bandiere posizionandoli alla destra del codice IATA del vettore.
*   **Archivio Avvistamenti Spotter al 100%**: La sezione `SpotterSection` è stata spostata all'esterno della griglia a due colonne principale, estendendosi per l'intera larghezza della pagina (100% content width) subito sotto alla griglia dei dati tecnici.

### D. Gamification & Licenze Pilota (Catture Utente)
*   **Pulsanti in Inglese**: I pulsanti di interazione sono stati standardizzati in inglese globale: **Spotted** (👁️), **Flown** (✈️) e il nuovo bottone **Favorite** (⭐).
*   **Database Schema Alteration**: È stato aggiornato il vincolo di controllo (CHECK constraint) `user_captures_status_check` nella tabella PostgreSQL `user_captures` per consentire lo status `'FAVORITE'` accanto ai preesistenti `'SPOTTED'` e `'FLOWN'`.
*   **Spiegazione Testuale Aggiornata**: Il testo esplicativo sotto ai pulsanti descrive in modo elegante in tutte le lingue (inclusi i profili in grigio telemetria a basso contrasto) lo scopo di ciascuno dei tre pulsanti e come essi influiscano sul profilo pilota dell'utente.
*   **Metriche del Profilo**: Aggiornato il cruscotto statistiche utente in `profile/page.tsx` con una prima colonna dedicata alle catture **Preferiti ⭐** e abilitato il rispettivo pulsante di toggle rapido nella lista dei velivoli.

---

## 2. Il Testo Benchmark: Lockheed L-1011-100 (`description_it`)

Di seguito viene riportato il testo esatto caricato nel database come modello di riferimento per la formattazione:

```markdown
### Contesto Storico & Origini

Il **Lockheed L-1011 TriStar** nacque negli anni '60, come risposta alla crescente domanda di aerei wide-body per rotte di medio-lungo raggio. La **Lockheed** puntava a creare un trimotore tecnologicamente avanzato, competitivo contro il **Boeing 747** e il **McDonnell Douglas DC-10**.

Il modello iniziale, l'**L-1011-1**, effettuò il primo volo nel **1970** ed entrò in servizio nel **1972**. Offriva un comfort superiore e innovazioni significative per l'epoca.

L'**L-1011-100** venne sviluppato in risposta alle richieste delle compagnie aeree per un raggio operativo maggiore, grazie a una capacità di carburante aumentata. Il suo primo volo avvenne nel **1975**, segnando un'evoluzione importante della famiglia TriStar.

### Architettura & Design Tecnologico

Il **L-1011** si distingueva per la sua configurazione a **tre motori**, con il propulsore centrale integrato nella coda tramite un innovativo condotto a S. Questo design riduceva la resistenza aerodinamica e il rumore.

Il motore scelto fu il potente **Rolls-Royce RB211-22B** turbofan, un propulsore all'avanguardia per l'efficienza e le prestazioni. La sua introduzione fu cruciale per il successo del progetto.

La struttura dell'aereo incorporava materiali avanzati per l'epoca, garantendo robustezza e leggerezza. Le ali furono progettate con un profilo **supercritico**, migliorando l'efficienza aerodinamica alle alte velocità.

Il sistema di controllo di volo era estremamente sofisticato, offrendo capacità di **atterraggio automatico (Autoland) CAT IIIc**. Questo permetteva operazioni in condizioni meteorologiche quasi nulle, una vera rivoluzione.

**Specifiche di Bordo:**
*   **Sistema di Atterraggio Automatico (Autoland) CAT IIIc** per visibilità zero
*   **Cucina a ponte inferiore** con montacarichi per un servizio efficiente
*   **Sistema di Soppressione del Rumore** del motore **RB211**, per un'esperienza più tranquilla

### Carriera Operativa & Vettori

L'**L-1011-100** trovò presto impiego presso importanti vettori aerei globali, apprezzato per la sua affidabilità e il comfort offerto ai passeggeri. Tra i primi operatori figurano **Eastern Air Lines**, **Delta Air Lines** e **TWA**.

Ha servito efficacemente rotte transcontinentali e internazionali di medio raggio, diventando un pilastro delle flotte di molte compagnie. Anche **British Airways** lo impiegò ampiamente.

Nonostante le sue eccellenti qualità, l'**L-1011** affrontò una dura competizione dal **DC-10** e dal **Boeing 747**. Questo limitò la sua produzione complessiva.

La **Lockheed** infine si ritirò dal mercato degli aerei commerciali dopo il programma TriStar. Tuttavia, l'aereo continuò a volare per decenni, testimoniando la sua robustezza intrinseca.

### Eredità & Impatto Culturale

L'**L-1011 TriStar** è ricordato come un pioniere tecnologico, introducendo molte innovazioni poi adottate nell'industria aeronautica. Il suo sistema **Autoland CAT IIIc** fu un punto di riferimento per la sicurezza.

È considerato uno degli aerei wide-body più sicuri mai costruiti, con un record di sicurezza eccezionale. Questo gli ha guadagnato la fiducia di passeggeri ed equipaggi.

Il TriStar è ancora amato da molti entusiasti dell'aviazione e ex dipendenti per la sua grazia nel volo e il suo design distintivo. Rappresenta un capitolo glorioso dell'ingegneria aeronautica americana.

La sua storia è indissolubilmente legata alla "guerra dei trimotori" con il **DC-10**, una rivalità che ha spinto l'innovazione in tutto il settore. L'**L-1011-100** rimane un simbolo di eccellenza ingegneristica.
```

---

## 3. Checklist per Replicazione Aereo per Aereo (Azione)

Quando si ottimizza un nuovo aereo nel database, procedere con i seguenti controlli rigorosi:

1.  **Stato Storico vs Attivo**: Verificare se il velivolo è ancora in servizio attivo globalmente. Se è dismesso, tutti i vettori in `airline_fleet` devono essere impostati su status `HISTORIC`.
2.  **Verificare la Veridicità dei Vettori**: Controllare ed inserire tutti i vettori storici o attivi principali associati al modello, evitando dati errati o parziali.
3.  **Spaziature SEO e Paragrafi**: Formattare la descrizione in italiano (`description_it`) dividendo accuratamente il testo con doppie andate a capo (`\n\n`) per creare paragrafi puliti.
4.  **Struttura Standard in 4 Capitoli**: Applicare rigidamente i 4 tag `### Contesto Storico & Origini`, `### Architettura & Design Tecnologico`, `### Carriera Operativa & Vettori`, `### Eredità & Impatto Culturale`.
5.  **Curiosità Tradotte**: Assicurarsi che i campi `trivia` nel DB non contengano frammenti in inglese nei profili in lingua italiana e che siano stimolanti per gli appassionati.
6.  **DIVIETO DI LINK DIRETTONE IN MARKDOWN**: Non usare mai link markdown del tipo `[NOME](URL)`. Il motore dell'applicazione non li supporta e produrrebbe errori grafici.
7.  **Auto-linking con Bold**: Per inserire un link ipertestuale automatico verso una Compagnia, Costruttore o Aereo, **scrivere semplicemente il nome circondato da doppi asterischi** (es. `**Pan American World Airways**` o `**Boeing 747**`). Il parser farà il matching con il database e applicherà dinamicamente il link correct nella pagina.

---

## 4. Prevenzione degli Errori di Formattazione (Evitare caratteri stray come '#')

Per garantire la massima pulizia del database ed evitare che caratteri come `#` rimangano orfani o vengano renderizzati erroneamente a schermo come testo normale, applicare le seguenti regole prima di qualsiasi salvataggio:

1.  **Regola dei Titoli**:
    *   Gli unici titoli permessi all'interno della descrizione sono i titoli di sezione principale (`### Titolo`) e di specifiche di bordo (`#### Titolo`).
    *   Non devono esserci caratteri `#` in nessun altro punto del testo (es. all'interno dei paragrafi, alla fine delle righe o in elenchi puntati).
2.  **Validator Regex (Pre-Save Check)**:
    *   Tutti i testi devono superare il seguente controllo automatico:
        ```javascript
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('#')) {
            // Unica forma valida: inizia con ### o #### seguito da spazio, e non contiene altri '#'
            const isValidHeading = /^###\s+[^#]+$/.test(line) || /^####\s+[^#]+$/.test(line);
            if (!isValidHeading) {
              throw new Error(`Errore sintattico riga ${index + 1}: Trovato '#' non valido in "${line}"`);
            }
          }
        });
        ```
3.  **Gestione Automatica**:
    *   Gli script di migrazione o arricchimento devono integrare questa funzione di validazione. In caso di fallimento, la transazione viene annullata e il testo viene corretto manualmente o rigenerato.

