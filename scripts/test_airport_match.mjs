import fetch from 'node-fetch';

const HEADERS = {
  "User-Agent": "AviationPokedexAirportScraper/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)"
};

async function fetchWikiJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  return await res.json();
}

async function searchWikipedia(query) {
  const url = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const data = await fetchWikiJSON(url);
  return data?.query?.search || [];
}

async function getWikipediaExtract(pageTitle) {
  const url = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&explaintext=1&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
  const data = await fetchWikiJSON(url);
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  const pageObj = pages[pageId];
  return {
    extract: pageObj?.extract || '',
    isDisambiguation: pageObj?.pageprops && ('disambiguation' in pageObj.pageprops)
  };
}

async function testMatch() {
  const ap = {
    name: "Djibouti-Ambouli International Airport",
    iata_code: "JIB",
    icao_code: "HDAM",
    city: "Gibuti",
    country: "Gibuti"
  };

  const searchQueries = [
    { type: 'Custom', query: "Ambouli" }
  ];

  for (const sq of searchQueries) {
    console.log(`\n--- Searching by ${sq.type}: "${sq.query}" ---`);
    const results = await searchWikipedia(sq.query);
    if (results.length === 0) {
      console.log("No results");
      continue;
    }
    
    // Print top 3 search results
    console.log("Top results:", results.slice(0, 3).map(r => r.title));
    
    const candidateTitle = results[0].title;
    const { extract, isDisambiguation } = await getWikipediaExtract(candidateTitle);
    console.log(`Candidate title: "${candidateTitle}"`);
    console.log(`Is Disambiguation: ${isDisambiguation}`);
    console.log(`Extract length: ${extract.length}`);
    if (extract.length > 0) {
      console.log(`Extract snippet: "${extract.substring(0, 300)}"`);
      
      const lowerTitle = candidateTitle.toLowerCase();
      const lowerExtract = extract.toLowerCase();
      
      // Let's test all flags
      const isListOrMetaPage = 
        lowerTitle.includes('codici') || 
        lowerTitle.includes('lista') || 
        lowerTitle.includes('elenco') || 
        lowerTitle.includes('aeroporti in') ||
        lowerTitle.includes('aeroporti del') ||
        lowerTitle.includes('aeroporti di') ||
        lowerTitle.includes('aerostazioni') ||
        lowerTitle.includes('classificazione') ||
        lowerTitle.includes('comune di') ||
        lowerTitle.includes('provincia di') ||
        lowerTitle.includes('territorio') ||
        lowerTitle.includes('regione di') ||
        lowerTitle.includes('stato di') ||
        lowerTitle.includes('ferrovia') ||
        lowerTitle.includes('stazione di') ||
        lowerTitle.startsWith('categoria:') ||
        lowerTitle.startsWith('portale:') ||
        lowerTitle.startsWith('progetto:') ||
        lowerTitle.startsWith('wikipedia:');
        
      const hasAirportKeywords = 
        lowerTitle.includes('aeroporto') || 
        lowerTitle.includes('eliporto') || 
        lowerTitle.includes('scalo') || 
        lowerExtract.includes('aeroporto') || 
        lowerExtract.includes('scalo aereo') || 
        lowerExtract.includes('base aerea') ||
        lowerExtract.includes('eliporto') ||
        lowerExtract.includes('pista d') ||
        lowerExtract.includes('traffico aereo') ||
        lowerExtract.includes('volo commerciale');

      const titleHasAirportKeyword = 
        lowerTitle.includes('aeroporto') || 
        lowerTitle.includes('eliporto') || 
        lowerTitle.includes('idroscalo') || 
        lowerTitle.includes('aerodromo') || 
        lowerTitle.includes('aviosuperficie') || 
        lowerTitle.includes('base aerea') ||
        lowerTitle.includes('base aeree') ||
        lowerTitle.includes('scalo aereo') ||
        lowerTitle.includes('airport') ||
        lowerTitle.includes('airfield');

      const isLocalityOrBiography = 
        /è\s+(?:un\s+comune|una\s+città|un\s+villaggio|un\s+centro\s+abitato|una\s+frazione|uno\s+stato|una\s+regione|un\s+dipartimento|una\s+contea|un'isola|un\s+territorio|un\s+distretto|un\s+paese|un\s+pioniere|un\s+aviatore|un\s+militare|un\s+politico|un\s+architetto|un\s+film|una\s+pellicola|una\s+guerra|un\s+conflitto)/i.test(extract.substring(0, 300));

      const isAirportPage = hasAirportKeywords && 
        (titleHasAirportKeyword || lowerExtract.substring(0, 150).includes('aeroporto') || lowerExtract.substring(0, 150).includes('base aerea') || lowerExtract.substring(0, 150).includes('airport')) && 
        !isListOrMetaPage && 
        !isLocalityOrBiography;

      console.log(`- hasAirportKeywords: ${hasAirportKeywords}`);
      console.log(`- titleHasAirportKeyword: ${titleHasAirportKeyword}`);
      console.log(`- isListOrMetaPage: ${isListOrMetaPage}`);
      console.log(`- isLocalityOrBiography: ${isLocalityOrBiography}`);
      console.log(`- isAirportPage (final check): ${isAirportPage}`);

      if (isAirportPage) {
        const stopwords = new Set([
          'aeroporto', 'aeroporti', 'aerostazione', 'eliporto', 'scalo', 'volo',
          'di', 'da', 'in', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'ai', 'agli', 'alle',
          'e', 'o', 'con', 'per', 'su', 'tra', 'fra', 'un', 'una', 'uno',
          'il', 'la', 'lo', 'i', 'gli', 'le', 'a', 'the', 'of', 'and', 'to', 'in', 'for', 'on', 'at', 'by', 'from', 'with', 'airport', 'airports', 'international', 'internazionale', 'regional', 'regionale',
          'new', 'old', 'saint', 'st', 'san', 'santa', 'city', 'città', 'town', 'comune', 'provincia', 'regione', 'stato', 'governorate', 'governatorato', 'district', 'distretto', 'island', 'isole', 'isola',
          'de', 'la', 'el', 'los', 'las', 'municipal'
        ]);

        const getCleanWords = (str) => {
          if (!str) return [];
          return str.toLowerCase()
            .replace(/[^a-z0-9áéíóúàèìòùäöüßñç']/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 3 && !stopwords.has(w));
        };

        const nameWords = getCleanWords(ap.name);
        const matchesName = nameWords.length > 0 && nameWords.some(w => 
          lowerTitle.includes(w) || 
          lowerExtract.substring(0, 300).includes(w)
        );
        console.log(`- nameWords:`, nameWords);
        console.log(`- matchesName: ${matchesName}`);

        let isCodeMatch = false;
        if (ap.iata_code && (new RegExp('\\b' + ap.iata_code + '\\b').test(extract) || new RegExp('\\b' + ap.iata_code + '\\b').test(candidateTitle))) {
          isCodeMatch = true;
        }
        if (ap.icao_code && (new RegExp('\\b' + ap.icao_code + '\\b').test(extract) || new RegExp('\\b' + ap.icao_code + '\\b').test(candidateTitle))) {
          isCodeMatch = true;
        }
        console.log(`- isCodeMatch: ${isCodeMatch}`);

        let isValidMatch = false;
        if (sq.type === 'ICAO' || sq.type === 'IATA') {
          isValidMatch = isCodeMatch || matchesName;
        } else if (sq.type === 'Name') {
          isValidMatch = matchesName;
        } else if (sq.type === 'City') {
          const cleanCity = ap.city.toLowerCase().replace(/\(.*\)/, '').trim();
          const matchesCity = cleanCity.length > 2 && (
            lowerTitle.includes(cleanCity) || 
            lowerExtract.substring(0, 400).includes(cleanCity)
          );
          isValidMatch = matchesCity && (matchesName || isCodeMatch);
          console.log(`- matchesCity: ${matchesCity}`);
        }
        console.log(`- isValidMatch: ${isValidMatch}`);
      }
    }
  }
}

testMatch();
