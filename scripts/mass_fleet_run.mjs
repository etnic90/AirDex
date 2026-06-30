import pg from 'pg';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const progressFile = resolve(__dirname, '../scratch/mass_fleet_progress.json');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getOperatorsFromAI(aircraftName, yearInfo, useSearch) {
  const prompt = `Fornisci un elenco accurato e storicamente completo di compagnie aeree (vettori) reali che operano o hanno operato il modello di aereo: "${aircraftName}"${yearInfo}.
Includi sia vettori attuali (ACTIVE) che storici/dismessi (HISTORIC), con una stima realistica del numero massimo di esemplari avuti in flotta (qty).

Rispondi esclusivamente in formato JSON come un array di oggetti, senza blocchi di codice markdown (NON usare \`\`\`json), senza spiegazioni, con la seguente struttura:
[
  {
    "airline_name": "Nome Compagnia (es. Lufthansa, American Airlines, Alitalia)",
    "iata_code": "IATA (2 lettere, es. LH, AA, AZ)",
    "status": "ACTIVE" o "HISTORIC",
    "qty": 15
  }
]
Fornisci almeno 8-15 operatori se si tratta di un aereo di linea diffuso, o solo gli operatori storici effettivi se si tratta di aerei più rari.
${useSearch ? "Usa Google Search per verificare le informazioni reali degli utilizzatori storici e attivi (ad esempio da Wikipedia) ed evita assolutamente di allucinare compagnie che non hanno mai operato questo modello." : "Evita assolutamente di allucinare compagnie che non hanno mai operato questo modello."}`;

  let attempts = 0;
  let delay = 10000;
  while (attempts < 3) {
    try {
      const config = {};
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config
      });
      const text = response.text.trim();
      const cleanJSON = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();
      return JSON.parse(cleanJSON);
    } catch (e) {
      attempts++;
      console.warn(`⚠️ Gemini API error for operators (Attempt ${attempts}/3): ${e.message}`);
      if (attempts < 3) {
        await sleep(delay);
        delay *= 2;
      }
    }
  }
  throw new Error("Failed to get operators from Gemini API");
}

async function main() {
  try {
    // 1. Get all airlines
    console.log("Loading airlines...");
    const airlinesRes = await client.query('SELECT id, name, iata_code, country FROM public.airlines');
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

    // Helper to match airline (strictly, to avoid IATA reuse issues)
    function findAirline(name, iata, aircraftFirstFlightYear) {
      const cleanName = normalizeName(name);
      if (!cleanName) return null;

      const stripParentheses = (str) => normalizeName(str.replace(/\([^)]+\)/g, '').trim());
      const extractParentheses = (str) => {
        const match = str.match(/\(([^)]+)\)/);
        return match ? normalizeName(match[1]) : '';
      };

      const cleanNameNoParens = stripParentheses(cleanName);

      // Temporal check helper
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
      const fullName = `${manufacturer} ${ac.model_name}`.trim();
      const yearInfo = ac.first_flight_year ? ` (Primo volo: ${ac.first_flight_year})` : '';

      status.currentModel = fullName;
      status.lastUpdate = new Date().toISOString();
      fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

      console.log(`\n[${status.processed + 1}/${status.total}] Processing: ${fullName}...`);

      const useSearch = !ac.first_flight_year || ac.first_flight_year < 1960;

      try {
        const ops = await getOperatorsFromAI(fullName, yearInfo, useSearch);
        if (!Array.isArray(ops)) {
          throw new Error("AI did not return an array");
        }

        // Clean existing fleet for this model
        await client.query('DELETE FROM public.airline_fleet WHERE aircraft_model_id = $1', [ac.id]);

        let matchedCount = 0;
        let operatorsLog = [];

        for (const op of ops) {
          if (!op.airline_name) continue;
          
          const match = findAirline(op.airline_name, op.iata_code, ac.first_flight_year);
          if (match) {
            const qty = parseInt(op.qty) || 5;
            const opStatus = op.status === 'ACTIVE' ? 'ACTIVE' : 'HISTORIC';
            
            await client.query(`
              INSERT INTO public.airline_fleet (aircraft_model_id, airline_id, qty, status)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT DO NOTHING
            `, [ac.id, match.id, qty, opStatus]);

            matchedCount++;
            operatorsLog.push(`${match.name} (${qty}, ${opStatus})`);
          } else {
            console.log(`  ❌ Could not match: "${op.airline_name}" (${op.iata_code || 'No IATA'})`);
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

      // Wait 3 seconds for search grounding, 1.5 seconds otherwise
      const waitTime = useSearch ? 3000 : 1500;
      await sleep(waitTime);
    }

    console.log("\n🏁 Fleet association complete!");

  } catch (err) {
    console.error("Irreversible error:", err);
  } finally {
    await client.end();
  }
}

main();
