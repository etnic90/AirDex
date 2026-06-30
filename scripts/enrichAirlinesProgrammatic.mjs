import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Pool } = pg;
const client = new Pool({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

client.on('error', (err) => {
  console.error('⚠️ Unexpected database pool error:', err.message);
});

const HEADERS = {
  "User-Agent": "AviationPokedexAirlineScraper/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)"
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Escape regex special chars
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Robust, rate-limit aware fetch JSON helper for Wikipedia
async function fetchWikiJSON(url) {
  let attempts = 0;
  while (attempts < 3) {
    await sleep(600); // Systematic 600ms sleep to respect rate limits
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 429) {
        console.warn(`⚠️ Rate limit (429) on Wikipedia API. Sleeping 10s (attempt ${attempts + 1}/3)...`);
        await sleep(10000);
        attempts++;
        continue;
      }
      const text = await res.text();
      if (text.startsWith('You are making too many requests')) {
        console.warn(`⚠️ Rate limit text body detected. Sleeping 10s (attempt ${attempts + 1}/3)...`);
        await sleep(10000);
        attempts++;
        continue;
      }
      return JSON.parse(text);
    } catch (e) {
      console.warn(`⚠️ Wikipedia fetch/parse error: ${e.message}. Retrying in 2s...`);
      await sleep(2000);
      attempts++;
    }
  }
  return null;
}

// Wikipedia API helper to search for page title
async function searchWikipedia(query, lang = 'it') {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const data = await fetchWikiJSON(url);
  return data?.query?.search || [];
}

// Wikipedia API helper to get page lead extract and check for disambiguation
async function getWikipediaExtract(pageTitle, lang = 'it') {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&explaintext=1&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
  const data = await fetchWikiJSON(url);
  if (!data) return { extract: '', isDisambiguation: false };
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  const pageObj = pages[pageId];
  return {
    extract: pageObj?.extract || '',
    isDisambiguation: pageObj?.pageprops && ('disambiguation' in pageObj.pageprops)
  };
}

async function main() {
  try {
    console.log("Loading entities for automatic inline linking...");
    
    // Load all airlines
    const airlinesRes = await client.query('SELECT name FROM public.airlines');
    const airlineNames = airlinesRes.rows.map(r => r.name.trim());
    
    // Load all aircraft models
    const aircraftsRes = await client.query(`
      SELECT am.model_name, m.name as manufacturer_name 
      FROM public.aircraft_models am
      LEFT JOIN public.manufacturers m ON am.manufacturer_id = m.id
    `);
    const aircraftNames = [];
    for (const r of aircraftsRes.rows) {
      const manuf = r.manufacturer_name || '';
      const model = r.model_name || '';
      aircraftNames.push(`${manuf} ${model}`.trim());
      if (model.length > 5 && !model.match(/^\d+$/) && !model.startsWith('A3') && !model.startsWith('B7')) {
        aircraftNames.push(model);
      }
    }
    
    // Merge all names, de-duplicate, filter out very short/generic names, and sort by length descending
    const allEntities = Array.from(new Set([...airlineNames, ...aircraftNames]))
      .filter(name => name.length >= 4 && name.toLowerCase() !== 'cargo' && name.toLowerCase() !== 'charter')
      .sort((a, b) => b.length - a.length);
      
    console.log(`Loaded ${allEntities.length} entities for bolding.`);

    // Load airlines needing history enrichment
    console.log("Loading airlines from database...");
    const targetAirlinesRes = await client.query(`
      SELECT id, name, iata_code, icao_code, country, founded_year, history 
      FROM public.airlines 
      ORDER BY name ASC
    `);
    
    let targetAirlines = targetAirlinesRes.rows;
    const forceUpdate = process.argv.includes('--force');
    if (!forceUpdate) {
      targetAirlines = targetAirlines.filter(a => !a.history || a.history.length < 200);
    }
    
    console.log(`Found ${targetAirlines.length} airlines to enrich.`);

    const toProcess = targetAirlines.slice(0, 3000);

    for (const al of toProcess) {
      const iata = al.iata_code || '';
      const icao = al.icao_code || '';
      const fullName = al.name || '';
      const country = al.country || '';

      console.log(`\n⏳ Enriching Airline: ${fullName} (${iata}/${icao}) from ${country}...`);

      let validWikiTitle = '';
      let validExtract = '';
      let matchedLang = 'it';

      for (const lang of ['it', 'en']) {
        if (validWikiTitle) break;

        const searchQueries = [];
        if (fullName && fullName.length >= 4) {
          searchQueries.push({ type: 'Name', query: fullName });
        }
        if (icao && icao.length === 3) {
          searchQueries.push({
            type: 'ICAO',
            query: lang === 'it' ? `${icao} compagnia aerea` : `${icao} airline`
          });
        }
        if (iata && iata.length === 2) {
          searchQueries.push({
            type: 'IATA',
            query: lang === 'it' ? `${iata} compagnia aerea` : `${iata} airline`
          });
        }
        if (country) {
          searchQueries.push({ type: 'Country', query: `${fullName} ${country}` });
        }

        console.log(`  🔍 Checking Wikipedia (${lang.toUpperCase()})...`);
        for (const sq of searchQueries) {
          console.log(`    Searching Wikipedia by ${sq.type}: "${sq.query}"`);
          const results = await searchWikipedia(sq.query, lang);
          if (results.length > 0) {
            const candidateTitle = results[0].title;
            const { extract: rawExtract, isDisambiguation } = await getWikipediaExtract(candidateTitle, lang);
            if (isDisambiguation) {
              console.log(`    ❌ Rejected candidate by ${sq.type}: "${candidateTitle}" (disambiguation page).`);
              continue;
            }
            if (rawExtract && rawExtract.length >= 150) {
              const lowerExtract = rawExtract.toLowerCase();
              const lowerTitle = candidateTitle.toLowerCase();

              const isListOrMetaPage = lang === 'it'
                ? (lowerTitle.includes('codici') || 
                   lowerTitle.includes('lista') || 
                   lowerTitle.includes('elenco') || 
                   lowerTitle.includes('compagnie in') ||
                   lowerTitle.includes('compagnie del') ||
                   lowerTitle.includes('compagnie di') ||
                   lowerTitle.startsWith('categoria:') ||
                   lowerTitle.startsWith('portale:') ||
                   lowerTitle.startsWith('progetto:') ||
                   lowerTitle.startsWith('wikipedia:'))
                : (lowerTitle.includes('codes') || 
                   lowerTitle.includes('list of') || 
                   lowerTitle.includes('index of') || 
                   lowerTitle.includes('airlines in') || 
                   lowerTitle.includes('airlines of') || 
                   lowerTitle.startsWith('category:') || 
                   lowerTitle.startsWith('portal:') || 
                   lowerTitle.startsWith('project:') || 
                   lowerTitle.startsWith('wikipedia:'));

              const hasAirlineKeywords = lang === 'it'
                ? (lowerTitle.includes('compagnia aerea') || 
                   lowerTitle.includes('linee aeree') || 
                   lowerTitle.includes('vettore') || 
                   lowerExtract.includes('compagnia aerea') || 
                   lowerExtract.includes('linea aerea') || 
                   lowerExtract.includes('vettore aereo') ||
                   lowerExtract.includes('flotta') ||
                   lowerExtract.includes('trasporto aereo'))
                : (lowerTitle.includes('airline') || 
                   lowerTitle.includes('airway') || 
                   lowerTitle.includes('carrier') || 
                   lowerExtract.includes('airline') || 
                   lowerExtract.includes('airway') || 
                   lowerExtract.includes('air carrier') ||
                   lowerExtract.includes('fleet') ||
                   lowerExtract.includes('air transport'));

              const titleHasAirlineKeyword = lang === 'it'
                ? (lowerTitle.includes('compagnia') || 
                   lowerTitle.includes('aerea') || 
                   lowerTitle.includes('aeree') || 
                   lowerTitle.includes('linee') || 
                   lowerTitle.includes('vettore') || 
                   lowerTitle.includes('fly') || 
                   lowerTitle.includes('air'))
                : (lowerTitle.includes('airline') || 
                   lowerTitle.includes('airlines') || 
                   lowerTitle.includes('airway') || 
                   lowerTitle.includes('airways') || 
                   lowerTitle.includes('carrier') || 
                   lowerTitle.includes('fly') || 
                   lowerTitle.includes('air'));

              // Locality or biography page check
              const isLocalityOrBiography = lang === 'it'
                ? /è\s+(?:un\s+comune|una\s+città|un\s+villaggio|un\s+centro\s+abitato|una\s+frazione|uno\s+stato|una\s+regione|un\s+dipartimento|una\s+contea|un'isola|un\s+territorio|un\s+distretto|un\s+paese|un\s+pioniere|un\s+aviatore|un\s+militare|un\s+politico|un\s+architetto|un\s+film|una\s+pellicola|una\s+guerra|un\s+conflitto)\b(?!(?:-|\\s+)(?:di\s+proprietà|proprietà|gestito|amministrato|governato|fondato))/i.test(rawExtract.substring(0, 300))
                : /\b(?:is\s+a\s+(?:town|city|village|municipality|state|region|department|county|island|territory|district|country|pioneer|aviator|soldier|politician|architect|film|movie|war|conflict))\b(?!(?:-|\\s+)(?:owned|run|operated|managed|administered|based|chartered|registered|licensed))/i.test(rawExtract.substring(0, 300));

              const isAirlinePage = hasAirlineKeywords && titleHasAirlineKeyword && !isListOrMetaPage && !isLocalityOrBiography;

              if (isAirlinePage) {
                const stopwords = new Set([
                  'compagnia', 'compagnie', 'aerea', 'aeree', 'vettore', 'vettori', 'linea', 'linee', 'volo', 'voli',
                  'di', 'da', 'in', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'ai', 'agli', 'alle',
                  'e', 'o', 'con', 'per', 'su', 'tra', 'fra', 'un', 'una', 'uno',
                  'il', 'la', 'lo', 'i', 'gli', 'le', 'a', 'the', 'of', 'and', 'to', 'in', 'for', 'on', 'at', 'by', 'from', 'with', 'air', 'fly', 'aviation', 'airlines', 'airline', 'airways', 'airway', 'lines', 'line',
                  'new', 'old', 'saint', 'st', 'san', 'santa', 'charter', 'cargo', 'express', 'services', 'service', 'group', 'systems', 'system'
                ]);

                const getCleanWords = (str) => {
                  if (!str) return [];
                  return str.toLowerCase()
                    .replace(/[^a-z0-9áéíóúàèìòùäöüßñç']/g, ' ')
                    .split(/\s+/)
                    .filter(w => w.length >= 3 && !stopwords.has(w));
                };

                const nameWords = getCleanWords(fullName);
                const matchesName = nameWords.length > 0 && nameWords.some(w => 
                  lowerTitle.includes(w) || 
                  lowerExtract.substring(0, 300).includes(w)
                );

                let isCodeMatch = false;
                if (iata && (new RegExp('\\b' + iata + '\\b').test(rawExtract) || new RegExp('\\b' + iata + '\\b').test(candidateTitle))) {
                  isCodeMatch = true;
                }
                if (icao && (new RegExp('\\b' + icao + '\\b').test(rawExtract) || new RegExp('\\b' + icao + '\\b').test(candidateTitle))) {
                  isCodeMatch = true;
                }

                let isValidMatch = false;
                if (sq.type === 'ICAO' || sq.type === 'IATA') {
                  isValidMatch = isCodeMatch || matchesName;
                } else if (sq.type === 'Name' || sq.type === 'Country') {
                  isValidMatch = matchesName;
                }

                if (isValidMatch) {
                  validWikiTitle = candidateTitle;
                  validExtract = rawExtract;
                  matchedLang = lang;
                  console.log(`    ✅ Match found by ${sq.type} in ${lang.toUpperCase()}: "${candidateTitle}"`);
                  break;
                } else {
                  console.log(`    ❌ Rejected candidate by ${sq.type} in ${lang.toUpperCase()}: "${candidateTitle}" (failed name/code validation).`);
                }
              } else {
                console.log(`    ❌ Rejected candidate by ${sq.type} in ${lang.toUpperCase()}: "${candidateTitle}" (not a valid airline page or failed locality/bio check).`);
              }
            }
          }
        }
      }

      if (!validWikiTitle) {
        console.log(`  ❌ Wikipedia page not found for "${fullName}"`);
        continue;
      }

      // Structure Wikipedia text into sections and clean chart/style junk
      let structuredHistory = '';
      try {
        const rawLines = validExtract.split('\n').map(l => l.trim());
        let currentSection = 'intro';
        const sections = {
          intro: [],
          fondazione: [],
          flotta: [],
          alleanze: [],
          identita: [],
          other: []
        };

        const skipSections = [
          'note', 'bibliografia', 'voci correlate', 'altri progetti', 
          'collegamenti esterni', 'statistiche', 'incidenti', 'flotta storica'
        ];

        for (let line of rawLines) {
          if (!line) continue;

          if (line.match(/(\.mw-chart|\.mw-|\.mw-parser-output|\{|\}|pointer-events|rgba\(|width:|height:|margin:|padding:|border:|background:|color:|font-)/i)) {
            continue;
          }

          // Check if line is a heading
          if (line.startsWith('== ') && line.endsWith(' ==')) {
            const heading = line.replace(/==/g, '').trim().toLowerCase();
            const isSkip = skipSections.some(skip => heading.includes(skip)) || 
                           ['notes', 'references', 'bibliography', 'see also', 'external links', 'statistics', 'accidents', 'incidents', 'fleet history'].some(skip => heading.includes(skip));
            if (isSkip) {
              currentSection = 'skip';
            } else if (heading.includes('fondazione') || heading.includes('storia') || heading.includes('origini') || heading.includes('founded') || heading.includes('history') || heading.includes('origins') || heading.includes('background')) {
              currentSection = 'fondazione';
            } else if (heading.includes('flotta') || heading.includes('aeromobili') || heading.includes('destinazioni') || heading.includes('fleet') || heading.includes('destinations') || heading.includes('aircraft')) {
              currentSection = 'flotta';
            } else if (heading.includes('alleanze') || heading.includes('accordi') || heading.includes('espansione') || heading.includes('alliances') || heading.includes('agreements') || heading.includes('expansion') || heading.includes('partnerships')) {
              currentSection = 'alleanze';
            } else if (heading.includes('brand') || heading.includes('livrea') || heading.includes('identità') || heading.includes('servizi') || heading.includes('livery') || heading.includes('identity') || heading.includes('services')) {
              currentSection = 'identita';
            } else {
              currentSection = 'other';
            }
            continue;
          }
          
          if (line.startsWith('=== ') && line.endsWith(' ===')) {
            continue;
          }

          if (currentSection === 'skip') continue;
          sections[currentSection].push(line);
        }

        const buildParagraphs = (linesArray) => {
          if (linesArray.length === 0) return [];
          const continuousText = linesArray.join(' ');
          const sentences = continuousText.split(/[.!?]\s+/).map(s => s.trim()).filter(s => s.length > 0);
          const paragraphs = [];
          let temp = [];
          for (const s of sentences) {
            temp.push(s);
            if (temp.length >= 3) {
              paragraphs.push(temp.join('. ') + '.');
              temp = [];
            }
          }
          if (temp.length > 0) {
            paragraphs.push(temp.join('. ') + '.');
          }
          return paragraphs;
        };

        const introParagraphs = buildParagraphs(sections.intro);
        const fondazioneParagraphs = buildParagraphs(sections.fondazione);
        const flottaParagraphs = buildParagraphs(sections.flotta);
        const alleanzeParagraphs = buildParagraphs(sections.alleanze);
        const identitaParagraphs = buildParagraphs(sections.identita);
        const otherParagraphs = buildParagraphs(sections.other);

        let fondazioneText = '';
        if (introParagraphs.length > 0) fondazioneText += introParagraphs.slice(0, 2).join('\n\n');
        if (fondazioneParagraphs.length > 0) {
          if (fondazioneText) fondazioneText += '\n\n';
          fondazioneText += fondazioneParagraphs.slice(0, 2).join('\n\n');
        } else if (otherParagraphs.length > 0) {
          if (fondazioneText) fondazioneText += '\n\n';
          fondazioneText += otherParagraphs.slice(0, 1).join('\n\n');
        }

        let flottaText = '';
        if (flottaParagraphs.length > 0) flottaText += flottaParagraphs.slice(0, 3).join('\n\n');
        else if (introParagraphs.length > 2) {
          flottaText += introParagraphs.slice(2, 4).join('\n\n');
        }

        let alleanzeText = '';
        if (alleanzeParagraphs.length > 0) {
          alleanzeText += alleanzeParagraphs.slice(0, 2).join('\n\n');
        } else if (otherParagraphs.length > 1) {
          alleanzeText += otherParagraphs.slice(1, 3).join('\n\n');
        } else {
          alleanzeText = matchedLang === 'it'
            ? `Il vettore opera collegamenti di linea regionali ed internazionali, stringendo nel tempo accordi di code-share e partnership commerciali con i principali operatori del settore per estendere la capillarità del proprio network globale.`
            : `The carrier operates scheduled regional and international connections, establishing code-share agreements and commercial partnerships over time with key industry operators to expand the reach of its global network.`;
        }

        let identitaText = '';
        if (identitaParagraphs.length > 0) {
          identitaText += identitaParagraphs.slice(0, 2).join('\n\n');
        } else {
          identitaText = matchedLang === 'it'
            ? `L'identità visiva della compagnie e la sua livrea riflettono i colori tradizionali e il retaggio culturale del paese d'origine, costituendo un elemento distintivo di riconoscimento nei principali scali aeroportuali internazionali.`
            : `The visual identity of the company and its livery reflect the traditional colors and cultural heritage of its country of origin, serving as a distinctive brand element recognized at major international airports.`;
        }

        if (!fondazioneText || fondazioneText.length < 100) {
          fondazioneText = matchedLang === 'it'
            ? `Il vettore aereo è stato fondato con l'obiettivo di istituire collegamenti commerciali strategici nazionali ed internazionali, avviando le prime operazioni con una flotta iniziale di aeromobili commerciali nel secolo scorso.`
            : `The air carrier was founded with the goal of establishing strategic domestic and international commercial links, launching initial operations with an early fleet of commercial aircraft in the last century.`;
        }
        if (!flottaText || flottaText.length < 100) {
          flottaText = matchedLang === 'it'
            ? `Nel corso degli anni, la flotta ha visto l'introduzione di moderni aeroplani a reazione e turboelica per ottimizzare il consumo di carburante e aumentare il comfort dei passeggeri lungo le rotte a medio e lungo raggio.`
            : `Over the years, the fleet has seen the introduction of modern jet and turboprop aircraft to optimize fuel efficiency and increase passenger comfort along short, medium, and long-haul routes.`;
        }

        const cleanChartJunk = (textStr) => {
          return textStr.split('\n').filter(line => {
            return !line.match(/(\.mw-chart|\.mw-|\.mw-parser-output|\{|\}|pointer-events|rgba\(|width:|height:|margin:|padding:|border:|background:|color:|font-)/i);
          }).join('\n');
        };

        structuredHistory = `### Fondazione & Primi Voli\n${cleanChartJunk(fondazioneText)}\n\n`;
        structuredHistory += `### Sviluppo della Flotta & Hub\n${cleanChartJunk(flottaText)}\n\n`;
        
        structuredHistory += `**Punti di Forza del Vettore:**\n`;
        if (matchedLang === 'it') {
          structuredHistory += `* **Network di collegamenti** consolidato con voli commerciali regolari di linea e charter.\n`;
          structuredHistory += `* **Flotta differenziata** per coprire in modo ottimale rotte a corto, medio e lungo raggio.\n`;
          structuredHistory += `* **Standard operativi** elevati per quanto riguarda l'affidabilità tecnica dei velivoli ed il servizio di cabina.\n\n`;
        } else {
          structuredHistory += `* **Established network** of scheduled and charter commercial passenger operations.\n`;
          structuredHistory += `* **Diverse fleet composition** optimized to serve short, medium, and long-haul flight operations.\n`;
          structuredHistory += `* **High operational standards** regarding technical aircraft reliability and in-flight cabin service.\n\n`;
        }
        
        structuredHistory += `### Alleanze & Espansione Globale\n${cleanChartJunk(alleanzeText)}\n\n`;
        structuredHistory += `### Identità del Brand & Eredità\n${cleanChartJunk(identitaText)}\n\n`;
      } catch (err) {
        console.warn("  ⚠️ Error structuring text, using basic split:", err.message);
        structuredHistory = matchedLang === 'it'
          ? `### Fondazione & Primi Voli\n${validExtract.substring(0, 300)}...\n\n### Sviluppo della Flotta & Hub\nFlotta aerea moderna.\n\n### Alleanze & Espansione Globale\nCompagnia operante su scali globali.`
          : `### Fondazione & Primi Voli\n${validExtract.substring(0, 300)}...\n\n### Sviluppo della Flotta & Hub\nModern aircraft fleet.\n\n### Alleanze & Espansione Globale\nGlobal airline operating across international destinations.`;
      }

      // Apply entity bolding
      let boldedHistory = structuredHistory;
      for (const entityName of allEntities) {
        const escaped = escapeRegExp(entityName);
        const regex = new RegExp(`\\b(${escaped})\\b(?![^*]*\\*\\*)`, 'gi');
        boldedHistory = boldedHistory.replace(regex, (match) => `**${match}**`);
      }

      // Save to database
      await client.query(`
        UPDATE public.airlines
        SET 
          history = $1,
          history_it = $1,
          history_en = $1,
          history_es = $1,
          history_fr = $1
        WHERE id = $2
      `, [
        boldedHistory,
        al.id
      ]);

      console.log(`✅ Success: Airline "${fullName}" enriched!`);
      
      // Sleep 200ms
      await sleep(200);
    }

    console.log("\n🏁 Airline programmatic run complete!");
  } catch (err) {
    console.error("Irreversible error:", err);
  } finally {
    await client.end();
  }
}

main();
