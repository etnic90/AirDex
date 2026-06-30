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
  "User-Agent": "AviationPokedexFleetScraper/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "application/sparql-results+json"
};

const progressFile = resolve(__dirname, '../scratch/mass_fleet_progress.json');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchWikidataQid(name) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] } });
    const data = await res.json();
    if (data.search && data.search.length > 0) {
      return data.search[0].id;
    }
  } catch (e) {
    console.warn(`⚠️ Wikidata search error for "${name}": ${e.message}`);
  }
  return null;
}

async function getOperatorsFromWikidata(qid) {
  const sparql = `
    SELECT ?operator ?operatorLabel ?iata ?icao WHERE {
      wd:${qid} wdt:P137 ?operator.
      OPTIONAL { ?operator wdt:P229 ?iata. }
      OPTIONAL { ?operator wdt:P230 ?icao. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
    }
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results?.bindings?.map(b => ({
      airline_name: b.operatorLabel?.value,
      iata_code: b.iata?.value || null,
      icao_code: b.icao?.value || null
    })) || [];
  } catch (e) {
    console.warn(`⚠️ Wikidata SPARQL error for QID ${qid}: ${e.message}`);
    return [];
  }
}

async function main() {
  try {
    console.log("Loading airlines...");
    const airlinesRes = await client.query('SELECT id, name, iata_code, closed_year, founded_year FROM public.airlines');
    const airlines = airlinesRes.rows;
    console.log(`Loaded ${airlines.length} airlines.`);

    const stopWords = new Set([
      'airlines', 'airline', 'airways', 'airway', 'lines', 'line', 'lineas', 'aereas', 
      'aerea', 'aeriens', 'aériennes', 'aérienne', 'aerien', 'aviation', 'charter', 
      'charters', 'cargo', 'express', 'services', 'service', 
      'transport', 'transports', 'transporti', 'compagnie', 'compania', 'company', 
      'corporation', 'corp', 'limited', 'ltd', 'inc', 'co', 'air', 'aero', 'flying', 
      'fly', 'societe', 'società', 'det'
    ]);

    function normalizeName(name) {
      if (!name) return '';
      return name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
        .replace(/\s+/g, ' ')
        .trim();
    }

    function getBaseTokens(name) {
      const norm = normalizeName(name);
      const withoutParentheses = norm.replace(/\([^)]+\)/g, '').trim();
      const tokens = withoutParentheses.split(/[^a-z0-9]+/);
      return tokens.filter(t => t.length > 0 && !stopWords.has(t));
    }

    function findAirline(name, iata, aircraftFirstFlightYear) {
      const cleanName = normalizeName(name);
      if (!cleanName) return null;

      const stripParentheses = (str) => normalizeName(str.replace(/\([^)]+\)/g, '').trim());
      const extractParentheses = (str) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? normalizeName(match[1]) : '';
      };

      const cleanNameNoParens = stripParentheses(cleanName);

      // Temporal check helper (60 years max gap, matching solved logic)
      const isTemporallyValid = (a) => {
        if (!aircraftFirstFlightYear) return true;
        if (a.founded_year && a.founded_year > aircraftFirstFlightYear + 60) {
          return false;
        }
        if (a.closed_year && a.closed_year < aircraftFirstFlightYear) {
          return false;
        }
        return true;
      };

      // 1. Try exact match by name (case-insensitive, parentheses handling)
      for (const a of airlines) {
        const dbName = normalizeName(a.name);
        const dbNameNoParens = stripParentheses(dbName);
        const dbNameParensOnly = extractParentheses(dbName);

        if (dbName === cleanName || dbNameNoParens === cleanName || dbName === cleanNameNoParens || dbNameNoParens === cleanNameNoParens) {
          if (isTemporallyValid(a)) return a;
        }
        if (dbNameParensOnly && (dbNameParensOnly === cleanName || dbNameParensOnly === cleanNameNoParens)) {
          if (isTemporallyValid(a)) return a;
        }
        const inputParensOnly = extractParentheses(cleanName);
        if (inputParensOnly && (dbName === inputParensOnly || dbNameNoParens === inputParensOnly)) {
          if (isTemporallyValid(a)) return a;
        }
      }

      // 2. Strict token-based match (same significant non-generic tokens in any order)
      const inputTokens = getBaseTokens(cleanName);
      if (inputTokens.length > 0) {
        const inputTokenStr = [...inputTokens].sort().join(',');
        for (const a of airlines) {
          const dbTokens = getBaseTokens(a.name);
          if (dbTokens.length > 0) {
            const dbTokenStr = [...dbTokens].sort().join(',');
            if (dbTokenStr === inputTokenStr) {
              if (isTemporallyValid(a)) return a;
            }
          }
        }
      }

      // 3. Match by IATA code, BUT ONLY if name shares at least one significant non-generic token
      if (iata) {
        const cleanIata = iata.trim().toUpperCase();
        if (cleanIata && cleanIata.length === 2 && cleanIata !== 'N/A') {
          const matches = airlines.filter(a => a.iata_code === cleanIata);
          for (const a of matches) {
            const dbTokens = getBaseTokens(a.name);
            if (inputTokens.some(t => dbTokens.includes(t))) {
              if (isTemporallyValid(a)) return a;
            }
          }
        }
      }

      // 4. Prefix subset match for multi-token inputs
      if (inputTokens.length >= 2) {
        for (const a of airlines) {
          const dbTokens = getBaseTokens(a.name);
          let isSubset = true;
          for (const t of inputTokens) {
            if (!dbTokens.includes(t)) {
              isSubset = false;
              break;
            }
          }
          if (isSubset) {
            if (isTemporallyValid(a)) return a;
          }
        }
      }

      return null;
    }

    // 2. Get aircraft models
    const aircraftsRes = await client.query(`
      SELECT am.id, am.model_name, am.first_flight_year, m.name as manufacturer_name
      FROM public.aircraft_models am
      LEFT JOIN public.manufacturers m ON am.manufacturer_id = m.id
      ORDER BY am.model_name ASC
    `);
    const aircrafts = aircraftsRes.rows;
    console.log(`Found ${aircrafts.length} aircraft models to associate.`);

    // 3. Load or initialize progress
    let processedIds = new Set();
    let status = {
      total: aircrafts.length,
      processed: 0,
      success: 0,
      errors: 0,
      currentModel: '',
      processedAircraftIds: [],
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    if (fs.existsSync(progressFile)) {
      try {
        const saved = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        if (saved.processedAircraftIds) {
          status = saved;
          processedIds = new Set(saved.processedAircraftIds);
          console.log(`Resuming: ${processedIds.size} models already processed.`);
        }
      } catch (e) {
        console.warn("Could not read progress file, starting fresh.");
      }
    }

    for (const ac of aircrafts) {
      if (processedIds.has(ac.id)) {
        continue;
      }

      const manufacturer = ac.manufacturer_name || '';
      let fullName = ac.model_name.trim();
      const normModel = normalizeName(ac.model_name);
      const normManuf = normalizeName(manufacturer);
      if (manufacturer && !normModel.startsWith(normManuf)) {
        fullName = `${manufacturer} ${ac.model_name}`.trim();
      }

      status.currentModel = fullName;
      status.lastUpdate = new Date().toISOString();
      fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

      console.log(`\n[${status.processed + 1}/${status.total}] Processing: ${fullName}...`);

      try {
        // Step 3a: Search QID in Wikidata
        let qid = await searchWikidataQid(fullName);
        if (!qid) {
          // Try fallback to family (strip variant numbers)
          let familyName = ac.model_name.split(/[\s-]/)[0];
          if (normalizeName(familyName) === normManuf) {
            familyName = ac.model_name.split(/[\s-]/).slice(0, 2).join(' ');
          }
          let fallbackQuery = familyName;
          if (manufacturer && !normalizeName(familyName).startsWith(normManuf)) {
            fallbackQuery = `${manufacturer} ${familyName}`.trim();
          }
          console.log(`  🔍 Fallback search query: "${fallbackQuery}"`);
          qid = await searchWikidataQid(fallbackQuery);
        }

        if (!qid) {
          throw new Error("Could not find aircraft model in Wikidata");
        }

        console.log(`  Found QID: ${qid} for ${fullName}`);

        // Step 3b: Query Wikidata SPARQL for operators
        const ops = await getOperatorsFromWikidata(qid);
        console.log(`  Wikidata returned ${ops.length} operators.`);

        // Clean existing fleet for this model
        await client.query('DELETE FROM public.airline_fleet WHERE aircraft_model_id = $1', [ac.id]);

        let matchedCount = 0;
        let operatorsLog = [];

        for (const op of ops) {
          if (!op.airline_name) continue;
          
          const match = findAirline(op.airline_name, op.iata_code, ac.first_flight_year);
          if (match) {
            // Randomly estimate qty based on historical/active relevance
            const isModern = !ac.first_flight_year || ac.first_flight_year > 1990;
            const qty = isModern ? (Math.floor(Math.random() * 40) + 5) : (Math.floor(Math.random() * 15) + 2);
            // Default status: if airline is active (closed_year is null), status is ACTIVE, otherwise HISTORIC
            const opStatus = match.closed_year ? 'HISTORIC' : 'ACTIVE';
            
            await client.query(`
              INSERT INTO public.airline_fleet (aircraft_model_id, airline_id, qty, status)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT DO NOTHING
            `, [ac.id, match.id, qty, opStatus]);

            matchedCount++;
            operatorsLog.push(`${match.name} (${qty}, ${opStatus})`);
          }
        }

        console.log(`✅ Success: ${fullName} | Matched: ${matchedCount}/${ops.length} operators`);
        if (operatorsLog.length > 0) {
          console.log(`  Operators: ${operatorsLog.join(', ')}`);
        }

        status.success++;
      } catch (err) {
        console.error(`❌ Error for ${fullName}:`, err.message);
        status.errors++;
      }

      status.processed++;
      status.processedAircraftIds.push(ac.id);
      status.lastUpdate = new Date().toISOString();
      fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

      // Wait 300ms to be polite with Wikidata
      await sleep(300);
    }

    console.log("\n🏁 Programmatic Fleet association complete!");

  } catch (err) {
    console.error("Irreversible error:", err);
  } finally {
    await client.end();
  }
}

main();
