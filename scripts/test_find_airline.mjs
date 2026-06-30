import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

const stopWords = new Set([
  'airlines', 'airline', 'airways', 'airway', 'lines', 'line', 'lineas', 'aereas', 
  'aerea', 'aeriens', 'aériennes', 'aérienne', 'aerien', 'aviation', 'charter', 
  'charters', 'cargo', 'express', 'regional', 'international', 'services', 'service', 
  'transport', 'transports', 'transporti', 'compagnie', 'compania', 'company', 
  'corporation', 'corp', 'limited', 'ltd', 'inc', 'co', 'group', 'holding', 
  'holdings', 'royal', 'national', 'air', 'aero', 'flying', 'fly', 'societe', 
  'società', 'det'
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
  // Strip parentheses content
  const withoutParentheses = norm.replace(/\([^)]+\)/g, '').trim();
  const tokens = withoutParentheses.split(/[^a-z0-9]+/);
  return tokens.filter(t => t.length > 0 && !stopWords.has(t));
}

function findAirline(name, iata, airlines, aircraftFirstFlightYear) {
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

  // 1. Try exact matches
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

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Loading airlines...");
    const airlinesRes = await client.query('SELECT id, name, iata_code, country, founded_year, closed_year FROM public.airlines');
    const airlines = airlinesRes.rows;
    console.log(`Loaded ${airlines.length} airlines.`);

    const testCases = [
      { name: "Silver City Airways", iata: null, expected: "null", firstFlight: 1945 },
      { name: "Lignes Aériennes Latécoère", iata: null, expected: "null", firstFlight: 1945 },
      { name: "ITA", iata: null, expected: "null", firstFlight: 1945 },
      { name: "ITA", iata: null, expected: "ITA Airways", firstFlight: 2022 },
      { name: "ITA Airways", iata: "AZ", expected: "ITA Airways", firstFlight: 2022 },
      { name: "TWA", iata: null, expected: "TWA (Trans World Airlines)", firstFlight: 1945 },
      { name: "Trans World Airlines", iata: null, expected: "TWA (Trans World Airlines)", firstFlight: 1945 },
      { name: "British European Airways", iata: "BE", expected: "British European Airways", firstFlight: 1945 },
      { name: "British European Airways", iata: null, expected: "British European Airways", firstFlight: 1945 },
      { name: "Silver Air", iata: null, expected: "Silver Air", firstFlight: 2010 }
    ];

    for (const tc of testCases) {
      const match = findAirline(tc.name, tc.iata, airlines, tc.firstFlight);
      const matchedName = match ? match.name : "null";
      console.log(`Input: "${tc.name}" (${tc.iata || 'No IATA'}) | Year: ${tc.firstFlight} -> Matched: "${matchedName}" (Expected: "${tc.expected}")`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
