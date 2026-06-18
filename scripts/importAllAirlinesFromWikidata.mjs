import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const HEADERS = {
  "User-Agent": "AviationPokedexLogoSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "application/sparql-results+json",
  "Accept-Encoding": "gzip, deflate"
};

async function importAirlines() {
  console.log("==========================================================");
  console.log("🚀 AVVIO IMPORTAZIONE & ARRICCHIMENTO COMPAGNIE GLOBALI");
  console.log("==========================================================");

  // 1. Recupera tutte le compagnie già esistenti per evitare conflitti e abilitare l'arricchimento
  console.log("🔍 Lettura compagnie esistenti dal database (con paginazione)...");
  let existing = [];
  let start = 0;
  const size = 1000;
  while (true) {
    const { data, error: readError } = await supabase
      .from('airlines')
      .select('id, name, iata_code, icao_code, country, founded_year, closed_year, website, logo_url, callsign, alliance, main_hub, slogan, headquarters')
      .range(start, start + size - 1);

    if (readError) {
      console.error("❌ Errore nel recupero delle compagnie esistenti:", readError.message);
      return;
    }
    existing = existing.concat(data || []);
    if (!data || data.length < size) {
      break;
    }
    start += size;
  }

  console.log(`📊 Trovate ${existing.length} compagnie nel database.`);

  // Mappe per la de-duplicazione e la ricerca rapida
  const seenNames = new Set(existing.map(a => a.name.toLowerCase()));
  const seenIatas = new Set(existing.map(a => a.iata_code?.toLowerCase()).filter(Boolean));
  const seenIcaos = new Set(existing.map(a => a.icao_code?.toLowerCase()).filter(Boolean));

  // Mappe per associare record esistenti da aggiornare/arricchire
  const existingByName = new Map();
  const existingByIcao = new Map();
  const existingByIata = new Map();

  for (const a of existing) {
    existingByName.set(a.name.toLowerCase(), a);
    if (a.icao_code) existingByIcao.set(a.icao_code.toLowerCase(), a);
    if (a.iata_code) existingByIata.set(a.iata_code.toLowerCase(), a);
  }

  // 2. Interroga Wikidata via SPARQL
  console.log("🛰️ Interrogazione Wikidata SPARQL per tutte le compagnie con codice IATA o ICAO...");
  const sparql = `
    SELECT ?airline ?airlineLabel ?iata ?icao ?callsign ?countryLabel ?website ?founded ?closed ?logo ?hubLabel ?slogan ?hqLabel WHERE {
      {
        ?airline wdt:P230 ?icao.
        OPTIONAL { ?airline wdt:P229 ?iata. }
      } UNION {
        ?airline wdt:P229 ?iata.
        OPTIONAL { ?airline wdt:P230 ?icao. }
      }
      OPTIONAL { ?airline wdt:P1078 ?callsign. }
      OPTIONAL { ?airline wdt:P17 ?country. }
      OPTIONAL { ?airline wdt:P856 ?website. }
      OPTIONAL { ?airline wdt:P571 ?founded. }
      OPTIONAL { ?airline wdt:P576 ?closed. }
      OPTIONAL { ?airline wdt:P154 ?logo. }
      OPTIONAL { ?airline wdt:P113 ?hub. }
      OPTIONAL { ?airline wdt:P1451 ?slogan. }
      OPTIONAL { ?airline wdt:P159 ?hq. }
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
    }
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  let bindings = [];
  let success = false;
  let attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log(`📡 Connessione a Wikidata (Tentativo ${attempt}/${attempts})...`);
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      console.log(`📥 Download completato. Parsing del JSON in corso...`);
      const data = await res.json();
      bindings = data.results?.bindings || [];
      success = true;
      break;
    } catch (err) {
      console.error(`⚠️ Tentativo ${attempt} fallito: ${err.message}`);
      if (attempt < attempts) {
        console.log("⏱️ Attesa di 2 secondi prima del prossimo tentativo...");
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  if (!success) {
    console.error("❌ Impossibile recuperare i dati da Wikidata dopo 3 tentativi.");
    return;
  }

  console.log(`📊 Ricevuti ${bindings.length} record grezzi da Wikidata.`);

  // 3. Raggruppamento per Wikidata URI per de-duplicare le relazioni 1-a-molti (es. più hub o più siti web)
  const airlinesMap = new Map();

  for (const b of bindings) {
    const uri = b.airline?.value;
    if (!uri) continue;

    const name = b.airlineLabel?.value;
    const iata = b.iata?.value?.toUpperCase()?.trim();
    const icao = b.icao?.value?.toUpperCase()?.trim();

    if (!name) continue;
    if (!iata && !icao) continue; // Salta se non ha nessun codice identificativo

    if (!airlinesMap.has(uri)) {
      airlinesMap.set(uri, {
        name,
        iata,
        icao,
        callsign: b.callsign?.value || null,
        country: b.countryLabel?.value || "Internazionale",
        founded: b.founded?.value || null,
        closed: b.closed?.value || null,
        logo: b.logo?.value || null,
        website: b.website?.value || null,
        hubs: new Set(),
        slogans: new Set(),
        hqs: new Set()
      });
    }

    const item = airlinesMap.get(uri);
    if (b.hubLabel?.value) item.hubs.add(b.hubLabel.value);
    if (b.slogan?.value) item.slogans.add(b.slogan.value);
    if (b.hqLabel?.value) item.hqs.add(b.hqLabel.value);
    
    // Aggiorna codici se per caso in un record erano mancanti e in un altro ci sono
    if (iata && !item.iata) item.iata = iata;
    if (icao && !item.icao) item.icao = icao;
    if (b.logo?.value && !item.logo) item.logo = b.logo.value;
    if (b.website?.value && !item.website) item.website = b.website.value;
    if (b.callsign?.value && !item.callsign) item.callsign = b.callsign.value;
  }

  console.log(`📊 ${airlinesMap.size} entità uniche identificate da Wikidata.`);

  // 4. Analisi ed elaborazione dei record
  const recordsToInsert = [];
  const recordsToUpdate = [];

  for (const [uri, data] of airlinesMap.entries()) {
    const { name, iata, icao, callsign, country, founded, closed, logo, website, hubs, slogans, hqs } = data;

    // Converte Sets in stringhe
    const mainHub = hubs.size > 0 ? Array.from(hubs).slice(0, 2).join(", ") : null;
    const slogan = slogans.size > 0 ? Array.from(slogans)[0] : null;
    const headquarters = hqs.size > 0 ? Array.from(hqs).slice(0, 2).join(", ") : null;

    // Risoluzione anno di fondazione e chiusura
    let foundedYear = 1950;
    if (founded) {
      const year = new Date(founded).getUTCFullYear();
      if (!isNaN(year)) foundedYear = year;
    }

    let closedYear = null;
    if (closed) {
      const year = new Date(closed).getUTCFullYear();
      if (!isNaN(year)) closedYear = year;
    }

    // Risoluzione URL logo da Commons
    let logoUrl = null;
    if (logo) {
      const filename = logo.substring(logo.lastIndexOf('/') + 1);
      logoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
    }

    // Controlla se la compagnia esiste già nel database (per nome o ICAO o IATA)
    let existingRecord = null;
    
    if (existingByName.has(name.toLowerCase())) {
      existingRecord = existingByName.get(name.toLowerCase());
    } else if (icao && existingByIcao.has(icao.toLowerCase())) {
      existingRecord = existingByIcao.get(icao.toLowerCase());
    } else if (iata && existingByIata.has(iata.toLowerCase())) {
      existingRecord = existingByIata.get(iata.toLowerCase());
    }

    if (existingRecord) {
      // Compagnia già esistente: verifichiamo se possiamo arricchire i suoi dati
      const updates = {};
      let needsUpdate = false;

      if (!existingRecord.main_hub && mainHub) {
        updates.main_hub = mainHub;
        needsUpdate = true;
      }
      if (!existingRecord.slogan && slogan) {
        updates.slogan = slogan;
        needsUpdate = true;
      }
      if (!existingRecord.headquarters && headquarters) {
        updates.headquarters = headquarters;
        needsUpdate = true;
      }
      if (!existingRecord.website && website) {
        updates.website = website;
        needsUpdate = true;
      }
      if (!existingRecord.callsign && callsign) {
        updates.callsign = callsign;
        needsUpdate = true;
      }
      if (!existingRecord.logo_url && logoUrl) {
        updates.logo_url = logoUrl;
        needsUpdate = true;
      }
      if (existingRecord.founded_year === 1950 && foundedYear !== 1950) {
        updates.founded_year = foundedYear;
        needsUpdate = true;
      }
      if (!existingRecord.closed_year && closedYear) {
        updates.closed_year = closedYear;
        needsUpdate = true;
      }

      if (needsUpdate) {
        recordsToUpdate.push({
          id: existingRecord.id,
          name: existingRecord.name,
          updates
        });
      }
    } else {
      // Nuova compagnia da inserire
      // Gestione collisioni IATA in memoria per l'inserimento
      let finalIata = iata || null;
      if (finalIata) {
        if (seenIatas.has(finalIata.toLowerCase())) {
          finalIata = null; // Collisione: azzera per l'inserimento ed evita errori unique constraint
        } else {
          seenIatas.add(finalIata.toLowerCase());
        }
      }

      // Gestione collisioni ICAO
      let finalIcao = icao || null;
      if (finalIcao) {
        if (seenIcaos.has(finalIcao.toLowerCase())) {
          // Se l'ICAO collide ed esiste già, saltiamo l'inserimento per evitare conflitti di chiavi
          continue;
        } else {
          seenIcaos.add(finalIcao.toLowerCase());
        }
      }

      seenNames.add(name.toLowerCase());

      recordsToInsert.push({
        name: name,
        iata_code: finalIata,
        icao_code: finalIcao,
        country: country,
        founded_year: foundedYear,
        closed_year: closedYear,
        website: website,
        logo_url: logoUrl,
        callsign: callsign,
        alliance: "Nessuna",
        main_hub: mainHub,
        slogan: slogan,
        headquarters: headquarters,
        history: `Compagnia aerea commerciale fondata nel ${foundedYear}. Codici operativi: IATA ${iata || 'N/D'}, ICAO ${icao || 'N/D'}.`
      });
    }
  }

  console.log(`📊 Compagnie pronte per l'inserimento (nuove): ${recordsToInsert.length}`);
  console.log(`📊 Compagnie pronte per l'arricchimento (aggiornamenti): ${recordsToUpdate.length}`);

  // 5. Inserimento dei nuovi record a blocchi di 100
  let insertedCount = 0;
  if (recordsToInsert.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      console.log(`📤 Inserimento blocco nuovi record ${Math.floor(i / batchSize) + 1}/${Math.ceil(recordsToInsert.length / batchSize)} (${batch.length} righe)...`);
      
      const { error: insertError } = await supabase
        .from('airlines')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Errore nell'inserimento del blocco:`, insertError.message);
      } else {
        insertedCount += batch.length;
      }
    }
  }

  // 6. Esecuzione degli aggiornamenti (arricchimento)
  let updatedCount = 0;
  if (recordsToUpdate.length > 0) {
    console.log(`⚙️ Esecuzione di ${recordsToUpdate.length} aggiornamenti per arricchire i dati...`);
    // Eseguiamo gli aggiornamenti in sequenza veloce o concorrenza controllata per non saturare la connessione
    const updateBatchSize = 20;
    for (let i = 0; i < recordsToUpdate.length; i += updateBatchSize) {
      const batch = recordsToUpdate.slice(i, i + updateBatchSize);
      await Promise.all(batch.map(async (item) => {
        const { error: updateError } = await supabase
          .from('airlines')
          .update(item.updates)
          .eq('id', item.id);

        if (updateError) {
          console.error(`❌ Errore aggiornamento per ${item.name} (${item.id}):`, updateError.message);
        } else {
          updatedCount++;
        }
      }));
      if (i % 100 === 0 && i > 0) {
        console.log(`  ├─ Elaborati ${i}/${recordsToUpdate.length} aggiornamenti...`);
      }
    }
  }

  console.log("==========================================================");
  console.log("🏁 PROCESSO DI IMPORTAZIONE & ARRICCHIMENTO CONCLUSO");
  console.log(`✅ Compagnie inserite con successo: ${insertedCount}/${recordsToInsert.length}`);
  console.log(`✅ Compagnie arricchite con successo: ${updatedCount}/${recordsToUpdate.length}`);
  console.log("==========================================================");
}

importAirlines();
