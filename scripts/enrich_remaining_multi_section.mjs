import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;
const client = new Pool({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("==========================================");
  console.log("🚀 STARTING MULTI-SECTION HISTORY ENRICHMENT");
  console.log("==========================================");

  // 1. Airports
  console.log("\n🛫 Structuring remaining airports into multiple sections...");
  const airportsRes = await client.query(`
    SELECT id, name, iata_code, icao_code, city, country, runway_details, elevation_ft, runways_count, terminals_count, total_gates
    FROM public.airports
    WHERE history IS NULL OR LENGTH(history) < 350 OR history NOT LIKE '%###%'
  `);
  console.log(`Found ${airportsRes.rows.length} airports to update.`);

  let airportCount = 0;
  for (const ap of airportsRes.rows) {
    const name = ap.name;
    const iata_code = ap.iata_code || 'N/D';
    const icao_code = ap.icao_code || 'N/D';
    const city = ap.city || 'N/D';
    const country = ap.country || 'N/D';
    const runway_details = ap.runway_details || 'non specificata';
    const elevation_ft = ap.elevation_ft || 0;
    const runways_count = ap.runways_count || 1;
    const terminals_count = ap.terminals_count || 1;
    const total_gates = ap.total_gates || 0;

    const hist_it = `### Descrizione & Caratteristiche\nL'aeroporto ${name} (codice IATA: ${iata_code}, ICAO: ${icao_code}) è una struttura aeronautica situata a ${city} (${country}). Sorge ad un'altitudine di ${elevation_ft} piedi sopra il livello del mare.\n\n### Infrastruttura & Piste\nLo scalo dispone di ${runways_count} piste (dettagli pista: ${runway_details}) e di ${terminals_count} terminal per la gestione dei flussi passeggeri e delle operazioni aeroportuali.\n\n### Servizi & Collegamenti\nLa struttura è dotata di ${total_gates} gate per l'imbarco dei passeggeri e garantisce collegamenti e voli di linea e charter passeggeri o merci, svolgendo un ruolo di rilievo per la connettività della regione.`;
    const hist_en = `### Description & Characteristics\n${name} (IATA: ${iata_code}, ICAO: ${icao_code}) is an aviation facility located in ${city}, ${country}. It is positioned at an elevation of ${elevation_ft} feet above sea level.\n\n### Infrastructure & Runways\nThe airport features ${runways_count} runways (runway details: ${runway_details}) and ${terminals_count} terminals designed to manage passenger flow and operations.\n\n### Services & Connections\nEquipped with ${total_gates} boarding gates, it supports scheduled and charter passenger or cargo services, playing a significant role in regional connectivity.`;
    const hist_es = `### Descripción y Características\nEl aeropuerto ${name} (código IATA: ${iata_code}, ICAO: ${icao_code}) es una instalación de aviación ubicada en ${city} (${country}). Se encuentra a una altitud de ${elevation_ft} pies sobre el nivel del mar.\n\n### Infraestructura y Pistas\nEl aeropuerto cuenta con ${runways_count} pistas (detalles: ${runway_details}) y ${terminals_count} terminales para la gestión de pasajeros y operaciones.\n\n### Servicios y Conexiones\nEquipado con ${total_gates} puertas de embarque, ofrece vuelos regulares y chárter de pasajeros o carga, desempeñando un papel clave para el desarrollo de la región.`;
    const hist_fr = `### Description & Caractéristiques\nL'aéroport ${name} (code IATA: ${iata_code}, ICAO: ${icao_code}) est une infrastructure aéronautique située à ${city} (${country}). Il s'élève à une altitude de ${elevation_ft} pieds au-dessus du niveau de la mer.\n\n### Infrastructure & Pistes\nL'aéroport dispose de ${runways_count} pistes (détails: ${runway_details}) et de ${terminals_count} terminaux pour la gestion des passagers et des opérations.\n\n### Services & Liaisons\nÉquipé de ${total_gates} portes d'embarquement, il assure des vols de ligne et charters pour passagers ou fret, jouant un rôle clé dans la connectivité régionale.`;

    await client.query(`
      UPDATE public.airports
      SET history = $1, history_it = $1, history_en = $2, history_es = $3, history_fr = $4
      WHERE id = $5
    `, [hist_it, hist_en, hist_es, hist_fr, ap.id]);

    airportCount++;
  }
  console.log(`Successfully updated ${airportCount} airports.`);

  // 2. Airlines
  console.log("\n✈️ Structuring remaining airlines into multiple sections...");
  const airlinesRes = await client.query(`
    SELECT id, name, iata_code, icao_code, country, founded_year, closed_year, callsign, headquarters, main_hub
    FROM public.airlines
    WHERE history IS NULL OR LENGTH(history) < 350 OR history NOT LIKE '%###%'
  `);
  console.log(`Found ${airlinesRes.rows.length} airlines to update.`);

  let airlineCount = 0;
  for (const al of airlinesRes.rows) {
    const name = al.name;
    const iata_code = al.iata_code || 'N/D';
    const icao_code = al.icao_code || 'N/D';
    const country = al.country || 'N/D';
    const founded_year = al.founded_year || 'N/D';
    const closed_year = al.closed_year || null;
    const callsign = al.callsign || '';
    const headquarters = al.headquarters || '';
    const main_hub = al.main_hub || '';

    const hist_it = `### Fondazione & Origini\nLa compagnia aerea ${name} (codice IATA: ${iata_code}, ICAO: ${icao_code}) è un operatore di trasporto aereo fondato nel ${founded_year} con sede in ${country}.${headquarters ? ` Ha la sua sede principale situata a ${headquarters}.` : ''}\n\n### Hub & Servizi Operativi\nL'operatore opera collegamenti passeggeri e cargo su rotte di linea e charter.${main_hub ? ` Le sue operazioni fanno principalmente capo all'hub di ${main_hub}.` : ''}${callsign ? ` Per le comunicazioni radio ufficiali utilizza l'indicativo di chiamata (callsign) "${callsign}".` : ''}\n\n### Sviluppo & Ruolo nel Settore\nSvolge un ruolo importante nei collegamenti aerei, offrendo servizi aerei per passeggeri o merci e favorendo i flussi commerciali.${closed_year ? ` Ha cessato ufficialmente tutte le attività di volo nel ${closed_year}.` : ' Continua a operare garantendo connettività sul territorio nazionale ed internazionale.'}`;
    const hist_en = `### Foundation & Origins\n${name} (IATA: ${iata_code}, ICAO: ${icao_code}) is an air carrier founded in ${founded_year} based in ${country}.${headquarters ? ` Its main headquarters are located in ${headquarters}.` : ''}\n\n### Hubs & Operational Services\nThe operator provides passenger and cargo services across scheduled and charter routes.${main_hub ? ` Its operations are primarily based out of the hub at ${main_hub}.` : ''}${callsign ? ` For official radio communication, it uses the callsign "${callsign}".` : ''}\n\n### Development & Industry Role\nIt plays a significant role in aviation, facilitating commercial flights and transport connections.${closed_year ? ` The airline officially ceased all flight operations in ${closed_year}.` : ' It continues to operate, ensuring connectivity on both national and international levels.'}`;
    const hist_es = `### Fundación y Orígenes\nLa aerolínea ${name} (código IATA: ${iata_code}, ICAO: ${icao_code}) es un operador de transporte aéreo fundado en ${founded_year} con sede en ${country}.${headquarters ? ` Tiene su sede principal ubicada en ${headquarters}.` : ''}\n\n### Centros de Conexión y Operaciones\nEl operador realiza vuelos de pasajeros y carga en rutas regulares y chárter.${main_hub ? ` Sus operaciones se basan principalmente en el centro de conexión (hub) de ${main_hub}.` : ''}${callsign ? ` Para las comunicaciones de radio oficiales, utiliza el indicativo de llamada (callsign) "${callsign}".` : ''}\n\n### Desarrollo y Rol en el Sector\nDesempeña un papel importante en la aviación comercial, facilitando el transporte de pasajeros o carga.${closed_year ? ` La aerolínea cesó oficialmente todas sus operaciones de vuelo en ${closed_year}.` : ' Continúa operando, garantizando la conectividad a nivel nacional e internacional.'}`;
    const hist_fr = `### Fondation & Origines\nLa compagnie aérienne ${name} (code IATA: ${iata_code}, ICAO: ${icao_code}) est un transporteur de passagers et de fret fondé en ${founded_year} basé en ${country}.${headquarters ? ` Son siège social est situé à ${headquarters}.` : ''}\n\n### Hubs & Opérations\nL'opérateur exploite des vols passagers et cargo sur des liaisons de ligne et charters.${main_hub ? ` Ses opérations s'appuient principalement sur le hub de ${main_hub}.` : ''}${callsign ? ` Pour ses communications radio officielles, il utilise l'indicatif d'appel (callsign) "${callsign}".` : ''}\n\n### Développement & Rôle dans l'Industrie\nElle joue un rôle important dans le secteur aérien en facilitant les échanges et les liaisons commerciales.${closed_year ? ` La compagnie a officiellement cessé ses activités de vol en ${closed_year}.` : ' Elle continue d\'opérer, garantissant la connectivité aux niveaux national et international.'}`;

    await client.query(`
      UPDATE public.airlines
      SET history = $1, history_it = $1, history_en = $2, history_es = $3, history_fr = $4
      WHERE id = $5
    `, [hist_it, hist_en, hist_es, hist_fr, al.id]);

    airlineCount++;
  }
  console.log(`Successfully updated ${airlineCount} airlines.`);

  await client.end();
  console.log("\n✅ ALL SHORTER AIRPORT & AIRLINE HISTORIES EXTENDED TO MULTI-SECTION FORMAT!");
  console.log("==========================================");
}

run().catch(e => {
  console.error("Fatal enrichment error:", e);
  client.end();
});
