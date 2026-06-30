import fetch from 'node-fetch';

const HEADERS = {
  "User-Agent": "AviationPokedexWikidataSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "application/sparql-results+json"
};

async function test() {
  // Let's test for Total Linhas Aéreas (Q7828033)
  const qid = 'Q7828033';
  const sparql = `
    SELECT ?item ?itemLabel ?itemDescription ?founded ?closed ?countryLabel ?hubLabel ?hqLabel ?parentLabel ?allianceLabel WHERE {
      BIND(wd:${qid} AS ?item)
      OPTIONAL { ?item wdt:P571 ?founded. }
      OPTIONAL { ?item wdt:P576 ?closed. }
      OPTIONAL { ?item wdt:P17 ?country. }
      OPTIONAL { ?item wdt:P113 ?hub. }
      OPTIONAL { ?item wdt:P159 ?hq. }
      OPTIONAL { ?item wdt:P749 ?parent. }
      OPTIONAL { ?item wdt:P114 ?alliance. }
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en,es,fr". }
    }
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) {
      const data = await res.json();
      console.log("Wikidata SPARQL results:");
      console.log(JSON.stringify(data.results?.bindings, null, 2));
    } else {
      console.log("Wikidata HTTP Error:", res.status);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
