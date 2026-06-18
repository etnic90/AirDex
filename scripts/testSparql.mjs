import fetch from 'node-fetch';

const HEADERS = {
  "User-Agent": "AviationPokedexLogoSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "application/sparql-results+json"
};

async function testSparql() {
  console.log("Querying Wikidata SPARQL endpoint with expanded query...");
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
    LIMIT 5000
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`HTTP error: ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }

    const data = await res.json();
    const bindings = data.results?.bindings || [];
    console.log(`Successfully fetched ${bindings.length} results.`);
    console.log("First 3 results:");
    console.log(JSON.stringify(bindings.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

testSparql();
