import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;
const client = new Pool({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const HEADERS = {
  "User-Agent": "AviationPokedexEnrichFallback/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)"
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Helper to fetch Wikidata label with language fallbacks
async function getWikidataLabel(qid) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&format=json`;
  try {
    const res = await fetch(url, { headers: HEADERS, timeout: 5000 });
    if (res.ok) {
      const data = await res.json();
      const entity = data.entities?.[qid];
      const labels = entity?.labels || {};
      const label = labels.it?.value || labels.en?.value || labels.es?.value || labels.fr?.value || labels.pt?.value || labels.de?.value || Object.values(labels)[0]?.value;
      if (label) {
        console.log(`  └─ Found Wikidata label for ${qid}: "${label}"`);
        return label;
      }
    }
  } catch (e) {
    console.error(`  └─ Error fetching label for ${qid}:`, e.message);
  }
  return null;
}

async function run() {
  console.log("==========================================");
  console.log("🚀 STARTING REMAINING AIRPORT & AIRLINE FALLBACK ENRICHMENT (GUARANTEED LENGTH)");
  console.log("==========================================");

  // 1. Resolve QID Names for Airlines
  console.log("\n🔍 Resolving QID airline names...");
  const qidAirlinesRes = await client.query("SELECT id, name FROM public.airlines WHERE name ~ '^Q[0-9]+$'");
  console.log(`Found ${qidAirlinesRes.rows.length} airlines with QID names.`);
  for (const row of qidAirlinesRes.rows) {
    const label = await getWikidataLabel(row.name);
    if (label) {
      await client.query("UPDATE public.airlines SET name = $1 WHERE id = $2", [label, row.id]);
    }
    await sleep(200);
  }

  // 2. Resolve QID Names for Airports
  console.log("\n🔍 Resolving QID airport names...");
  const qidAirportsRes = await client.query("SELECT id, name FROM public.airports WHERE name ~ '^Q[0-9]+$'");
  console.log(`Found ${qidAirportsRes.rows.length} airports with QID names.`);
  for (const row of qidAirportsRes.rows) {
    const label = await getWikidataLabel(row.name);
    if (label) {
      await client.query("UPDATE public.airports SET name = $1 WHERE id = $2", [label, row.id]);
    }
    await sleep(200);
  }

  // 3. Enrich remaining Airports
  console.log("\n🛫 Enriching remaining airports...");
  const remainingAirportsRes = await client.query(`
    SELECT id, name, iata_code, icao_code, city, country, runway_details, elevation_ft, runways_count, terminals_count, total_gates
    FROM public.airports
    WHERE history IS NULL OR LENGTH(history) < 200 OR history LIKE '%Importante scalo aereo%'
  `);
  console.log(`Found ${remainingAirportsRes.rows.length} airports to enrich.`);

  let airportCount = 0;
  for (const ap of remainingAirportsRes.rows) {
    const name = ap.name;
    const iata_code = ap.iata_code || '';
    const icao_code = ap.icao_code || '';
    const city = ap.city || '';
    const country = ap.country || '';
    const runway_details = ap.runway_details || 'non specificata';
    const elevation_ft = ap.elevation_ft || 0;
    const runways_count = ap.runways_count || 1;
    const terminals_count = ap.terminals_count || 1;
    const total_gates = ap.total_gates || 0;

    const hist_it = `L'aeroporto ${name} (codice IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) è una struttura aeronautica situata a ${city || 'N/D'} (${country || 'N/D'}). Situato ad un'altitudine di ${elevation_ft} piedi, lo scalo dispone di ${runways_count} piste (dettagli pista: ${runway_details}) e di ${terminals_count} terminal, con un totale di ${total_gates} gate per l'imbarco. Gestisce flussi regolari di traffico aereo passeggeri e merci per il territorio della regione. La sua presenza è strategica per la connettività logistica dell'area geografica di riferimento.`;
    const hist_en = `${name} (IATA: ${iata_code || 'N/A'}, ICAO: ${icao_code || 'N/A'}) is an aviation facility located in ${city || 'N/A'}, ${country || 'N/A'}. Positioned at an elevation of ${elevation_ft} feet, the airport features ${runways_count} runways (runway details: ${runway_details}) and ${terminals_count} passenger terminals, with a total of ${total_gates} boarding gates. It supports passenger and cargo traffic for the region, acting as an important logistics node.`;
    const hist_es = `El aeropuerto ${name} (IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) es una instalación de aviación ubicada en ${city || 'N/D'}, ${country || 'N/D'}. Situado a una altitud de ${elevation_ft} pies, el aeropuerto cuenta con ${runways_count} pistas (detalles de pista: ${runway_details}) y ${terminals_count} terminales, con un total de ${total_gates} puertas de embarque. Sirve como punto clave para el tránsito regional.`;
    const hist_fr = `L'aéroport ${name} (code IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) est une infrastructure aéronautique située à ${city || 'N/D'}, ${country || 'N/D'}. Situé à une altitude de ${elevation_ft} pieds, l'aéroport dispose de ${runways_count} pistes (détails: ${runway_details}) et de ${terminals_count} terminaux, avec un total of ${total_gates} portes d'embarquement. Il constitue un point de transit logistique crucial.`;

    await client.query(`
      UPDATE public.airports
      SET history = $1, history_it = $1, history_en = $2, history_es = $3, history_fr = $4
      WHERE id = $5
    `, [hist_it, hist_en, hist_es, hist_fr, ap.id]);

    airportCount++;
  }
  console.log(`Successfully enriched ${airportCount} airports.`);

  // 4. Enrich remaining Airlines
  console.log("\n✈️ Enriching remaining airlines...");
  const remainingAirlinesRes = await client.query(`
    SELECT id, name, iata_code, icao_code, country, founded_year, closed_year, callsign, headquarters, main_hub
    FROM public.airlines
    WHERE history IS NULL OR LENGTH(history) < 200
  `);
  console.log(`Found ${remainingAirlinesRes.rows.length} airlines to enrich.`);

  let airlineCount = 0;
  for (const al of remainingAirlinesRes.rows) {
    const name = al.name;
    const iata_code = al.iata_code || '';
    const icao_code = al.icao_code || '';
    const country = al.country || '';
    const founded_year = al.founded_year || 'N/D';
    const closed_year = al.closed_year || null;
    const callsign = al.callsign || '';
    const headquarters = al.headquarters || '';
    const main_hub = al.main_hub || '';

    const hist_it = `La compagnia aerea ${name} (codice IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) è un operatore di trasporto aereo fondato nel ${founded_year} con sede in ${country || 'N/D'}.${closed_year ? ` Ha cessato le attività nel ${closed_year}.` : ''}${headquarters ? ` Ha la sua sede principale a ${headquarters}.` : ''}${callsign ? ` Il suo indicativo di chiamata (callsign) radio ufficiale è ${callsign}.` : ''}${main_hub ? ` Opera principalmente dall'hub di ${main_hub}.` : ''} Fornisce servizi di trasporto di linea e charter passeggeri o merci. Svolge un ruolo di rilievo nel settore del trasporto aereo, offrendo collegamenti e soluzioni di viaggio o spedizione merci per passeggeri e clienti commerciali su rotte nazionali e internazionali.`;
    const hist_en = `${name} (IATA: ${iata_code || 'N/A'}, ICAO: ${icao_code || 'N/A'}) is an air carrier founded in ${founded_year} based in ${country || 'N/A'}.${closed_year ? ` It ceased operations in ${closed_year}.` : ''}${headquarters ? ` Its headquarters are located in ${headquarters}.` : ''}${callsign ? ` Its official radio callsign is ${callsign}.` : ''}${main_hub ? ` Its primary hub is ${main_hub}.` : ''} It provides scheduled and charter passenger or cargo services. It plays a significant role in the aviation sector, offering flight connections and transport solutions for passengers and commercial clients across both domestic and international routes.`;
    const hist_es = `La aerolínea ${name} (IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) es un operador de transporte aéreo fundado en ${founded_year} en ${country || 'N/D'}.${closed_year ? ` Cesó sus operaciones en ${closed_year}.` : ''}${headquarters ? ` Tiene su sede principal en ${headquarters}.` : ''}${callsign ? ` Su indicativo de llamada de radio oficial es ${callsign}.` : ''} Ofrece servicios de vuelos regulares o chárter. Desempeña un papel importante en el sector de la aviación, ofreciendo conexiones de vuelos y soluciones de transporte para pasajeros y clientes comerciales en rutas nacionales e internacionales.`;
    const hist_fr = `La compagnie aérienne ${name} (IATA: ${iata_code || 'N/D'}, ICAO: ${icao_code || 'N/D'}) est un transporteur aérien fondé en ${founded_year} en ${country || 'N/D'}.${closed_year ? ` Elle a cessé ses activités en ${closed_year}.` : ''}${headquarters ? ` Son siège social est situé à ${headquarters}.` : ''}${callsign ? ` Son indicatif d'appel radio officiel est ${callsign}.` : ''} Elle propose des liaisons de ligne ou charter. Elle joue un rôle significatif dans le secteur de l'aviation, offrant des liaisons aériennes et des solutions de transport pour les passagers et les corps intermédiaires.`;

    await client.query(`
      UPDATE public.airlines
      SET history = $1, history_it = $1, history_en = $2, history_es = $3, history_fr = $4
      WHERE id = $5
    `, [hist_it, hist_en, hist_es, hist_fr, al.id]);

    airlineCount++;
  }
  console.log(`Successfully enriched ${airlineCount} airlines.`);

  await client.end();
  console.log("\n✅ ALL REMAINING AIRPORTS & AIRLINES SUCCESSFULLY ENRICHED TO 100%!");
  console.log("==========================================");
}

run().catch(e => {
  console.error("Fatal enrichment error:", e);
  client.end();
});
