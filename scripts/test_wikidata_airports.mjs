import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const HEADERS = {
  "User-Agent": "AviationPokedexWikidataSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "application/sparql-results+json"
};

async function test() {
  const { data: airports } = await supabase
    .from('airports')
    .select('id, name, iata_code, icao_code, city, country')
    .or('history.is.null, history.like.%Importante scalo aereo%')
    .limit(5);

  console.log("Airports to search:", airports.map(a => `${a.name} (${a.iata_code}/${a.icao_code})`));

  for (const ap of airports) {
    const icao = ap.icao_code;
    const iata = ap.iata_code;
    
    // Construct SPARQL query to search by ICAO or IATA
    let query = '';
    if (icao) {
      query = `
        SELECT ?item ?itemLabel ?itemDescription ?elevation ?countryLabel ?adminLabel ?coord WHERE {
          ?item wdt:P230 "${icao}".
          OPTIONAL { ?item wdt:P18 ?image. }
          OPTIONAL { ?item wdt:P2044 ?elevation. }
          OPTIONAL { ?item wdt:P17 ?country. }
          OPTIONAL { ?item wdt:P131 ?admin. }
          OPTIONAL { ?item wdt:P625 ?coord. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en,es,fr". }
        }
        LIMIT 1
      `;
    } else if (iata) {
      query = `
        SELECT ?item ?itemLabel ?itemDescription ?elevation ?countryLabel ?adminLabel ?coord WHERE {
          ?item wdt:P229 "${iata}".
          OPTIONAL { ?item wdt:P18 ?image. }
          OPTIONAL { ?item wdt:P2044 ?elevation. }
          OPTIONAL { ?item wdt:P17 ?country. }
          OPTIONAL { ?item wdt:P131 ?admin. }
          OPTIONAL { ?item wdt:P625 ?coord. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en,es,fr". }
        }
        LIMIT 1
      `;
    }

    if (!query) continue;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) {
        const json = await res.json();
        const bindings = json.results?.bindings || [];
        if (bindings.length > 0) {
          const item = bindings[0];
          console.log(`\nFound Wikidata entity for ${ap.name}:`);
          console.log(`- QID: ${item.item?.value}`);
          console.log(`- Label: ${item.itemLabel?.value}`);
          console.log(`- Description: ${item.itemDescription?.value}`);
          console.log(`- Country: ${item.countryLabel?.value}`);
          console.log(`- Admin: ${item.adminLabel?.value}`);
          console.log(`- Elevation: ${item.elevation?.value}`);
          console.log(`- Coord: ${item.coord?.value}`);
        } else {
          console.log(`\nNo Wikidata entity found for ${ap.name}`);
        }
      } else {
        console.log(`\nWikidata HTTP Error for ${ap.name}: ${res.status}`);
      }
    } catch (e) {
      console.log(`\nWikidata Error for ${ap.name}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

test();
