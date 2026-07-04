import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const connectionString = "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

// Translations setup
const headingTranslations = {
  en: {
    "### Contesto Storico & Origini": "### Historical Context & Origins",
    "### Architettura & Design Tecnologico": "### Architecture & Technological Design",
    "#### Specifiche di Bordo": "#### Onboard Specifications",
    "### Carriera Operativa & Vettori": "### Operational Career & Operators",
    "### Eredità & Impatto Culturale": "### Legacy & Cultural Impact"
  },
  es: {
    "### Contesto Storico & Origini": "### Contexto Histórico y Orígenes",
    "### Architettura & Design Tecnologico": "### Arquitectura y Diseño Tecnológico",
    "#### Specifiche di Bordo": "#### Especificaciones de Bordo",
    "### Carriera Operativa & Vettori": "### Carrera Operativa y Operadores",
    "### Eredità & Impatto Culturale": "### Legado e Impacto Cultural"
  },
  fr: {
    "### Contesto Storico & Origini": "### Contexte Historique & Origines",
    "### Architettura & Design Tecnologico": "### Architecture & Conception Technologique",
    "#### Specifiche di Bordo": "#### Spécifications de Bord",
    "### Carriera Operativa & Vettori": "### Carrière Opérationnelle & Opérateurs",
    "### Eredità & Impatto Culturale": "### Héritage & Impact Culturel"
  },
  de: {
    "### Contesto Storico & Origini": "### Historischer Kontext & Ursprünge",
    "### Architettura & Design Tecnologico": "### Architektur & Technologisches Design",
    "#### Specifiche di Bordo": "#### Bordspezifikationen",
    "### Carriera Operativa & Vettori": "### Operative Karriere & Fluggesellschaften",
    "### Eredità & Impatto Culturale": "### Erbe & Kultureller Einfluss"
  }
};

const logFile = "C:/wamp64/www/aviation-pokedex/translation_progress.log";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Pool-based query with automatic retry on connection errors
async function queryWithRetry(pool, text, params = [], retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const isConnectionErr = err.message && (
        err.message.includes('Connection terminated') ||
        err.message.includes('connection timeout') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('EPIPE') ||
        err.message.includes('connect ETIMEDOUT') ||
        err.code === 'ECONNRESET' ||
        err.code === '57P01' // Supabase idle timeout
      );
      if (isConnectionErr && attempt < retries) {
        const waitMs = Math.min(2000 * Math.pow(2, attempt - 1), 30000); // exponential backoff, max 30s
        log(`DB connection error (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${waitMs/1000}s...`);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }
}

async function translateParagraph(text, targetLang, sourceLang = 'it', retries = 4) {
  if (!text) return "";
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          return data[0].map(item => item[0]).join('');
        }
      }
    } catch (e) {
      if (attempt < retries) {
        await sleep(1000 * attempt);
      } else {
        log(`Error translating paragraph: ${e.message}`);
      }
    }
  }
  return text; // fallback: return original
}

async function translateFullDescription(descriptionIt, targetLang) {
  if (!descriptionIt) return null;
  const paragraphs = descriptionIt.split('\n');
  const translated = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      translated.push("");
      continue;
    }

    if (trimmed.startsWith('#')) {
      const standardHeading = headingTranslations[targetLang]?.[trimmed];
      if (standardHeading) {
        translated.push(standardHeading);
      } else {
        const headingText = trimmed.replace(/^#+\s+/, '');
        const hashPrefix = trimmed.match(/^#+/)[0];
        const translatedHeadingText = await translateParagraph(headingText, targetLang, 'it');
        translated.push(`${hashPrefix} ${translatedHeadingText}`);
      }
      continue;
    }

    if (trimmed.startsWith('*')) {
      const listText = trimmed.replace(/^\*\s+/, '');
      const translatedListText = await translateParagraph(listText, targetLang, 'it');
      translated.push(`*   ${translatedListText}`);
    } else {
      const translatedText = await translateParagraph(trimmed, targetLang, 'it');
      translated.push(translatedText);
    }
    
    await sleep(100);
  }

  return translated.join('\n');
}

async function translateHistoryToGerman(historyEn) {
  if (!historyEn) return null;
  const paragraphs = historyEn.split('\n');
  const translated = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      translated.push("");
      continue;
    }

    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s+/, '');
      const hashPrefix = trimmed.match(/^#+/)[0];
      const translatedHeadingText = await translateParagraph(headingText, 'de', 'en');
      translated.push(`${hashPrefix} ${translatedHeadingText}`);
      continue;
    }

    const translatedText = await translateParagraph(trimmed, 'de', 'en');
    translated.push(translatedText);
    
    await sleep(100);
  }

  return translated.join('\n');
}

async function main() {
  // Append to log (don't clear) so we don't lose history across restarts
  fs.appendFileSync(logFile, `\n=== TRANSLATION SYSTEM RESTARTED (${new Date().toISOString()}) ===\n`);
  log("Initializing connection pool to database...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,                    // max pool connections
    idleTimeoutMillis: 30000,  // release idle connections after 30s
    connectionTimeoutMillis: 10000,
    keepAlive: true,           // send TCP keepalive to prevent idle drops
    keepAliveInitialDelayMillis: 10000
  });

  pool.on('error', (err) => {
    log(`Pool error event (non-fatal): ${err.message}`);
  });

  try {
    // Verify connectivity
    await queryWithRetry(pool, 'SELECT 1');
    log("Connected successfully. Scanning remaining tasks...");

    // Get count of remaining items
    const countRes = await queryWithRetry(pool, `
      SELECT 
        (SELECT COUNT(*) FROM aircraft_models WHERE description_it IS NOT NULL AND description_it <> '' AND (description_en IS NULL OR description_de IS NULL OR description_es IS NULL OR description_fr IS NULL)) as planes,
        (SELECT COUNT(*) FROM airlines WHERE history_en IS NOT NULL AND history_en <> '' AND history_de IS NULL) as airlines,
        (SELECT COUNT(*) FROM airports WHERE history_en IS NOT NULL AND history_en <> '' AND history_de IS NULL) as airports
    `);
    const stats = countRes.rows[0];
    log(`Initial remaining to translate: Planes=${stats.planes}, Airlines=${stats.airlines}, Airports=${stats.airports}`);

    let active = true;
    let consecutiveEmptyRounds = 0;

    while (active) {
      let processedAny = false;

      // 1. Process 1 Aircraft Model (all 4 langs)
      try {
        const planeRes = await queryWithRetry(pool, `
          SELECT id, model_name, description_it
          FROM aircraft_models
          WHERE description_it IS NOT NULL 
            AND description_it <> ''
            AND (description_en IS NULL OR description_de IS NULL OR description_es IS NULL OR description_fr IS NULL)
          LIMIT 1
        `);
        if (planeRes.rows.length > 0) {
          const aircraft = planeRes.rows[0];
          log(`Translating aircraft: ${aircraft.model_name}`);
          const descEn = await translateFullDescription(aircraft.description_it, 'en');
          const descEs = await translateFullDescription(aircraft.description_it, 'es');
          const descFr = await translateFullDescription(aircraft.description_it, 'fr');
          const descDe = await translateFullDescription(aircraft.description_it, 'de');

          await queryWithRetry(pool, `
            UPDATE aircraft_models
            SET description_en = $1, description_es = $2, description_fr = $3, description_de = $4
            WHERE id = $5
          `, [descEn, descEs, descFr, descDe, aircraft.id]);
          log(`Successfully saved translations for ${aircraft.model_name}`);
          processedAny = true;
          await sleep(2000);
        }
      } catch (err) {
        log(`Error processing aircraft: ${err.message}`);
        await sleep(5000);
      }

      // 2. Process 2 Airlines to German
      try {
        const airlineRes = await queryWithRetry(pool, `
          SELECT id, name, history_en 
          FROM airlines 
          WHERE history_en IS NOT NULL 
            AND history_en <> '' 
            AND history_de IS NULL
          LIMIT 2
        `);
        for (const airline of airlineRes.rows) {
          log(`Translating airline history: ${airline.name}`);
          const historyDe = await translateHistoryToGerman(airline.history_en);
          await queryWithRetry(pool, `
            UPDATE airlines SET history_de = $1 WHERE id = $2
          `, [historyDe, airline.id]);
          log(`Successfully saved German history for airline ${airline.name}`);
          processedAny = true;
          await sleep(2000);
        }
      } catch (err) {
        log(`Error processing airline: ${err.message}`);
        await sleep(5000);
      }

      // 3. Process 2 Airports to German
      try {
        const airportRes = await queryWithRetry(pool, `
          SELECT id, name, history_en 
          FROM airports 
          WHERE history_en IS NOT NULL 
            AND history_en <> '' 
            AND history_de IS NULL
          LIMIT 2
        `);
        for (const airport of airportRes.rows) {
          log(`Translating airport history: ${airport.name}`);
          const historyDe = await translateHistoryToGerman(airport.history_en);
          await queryWithRetry(pool, `
            UPDATE airports SET history_de = $1 WHERE id = $2
          `, [historyDe, airport.id]);
          log(`Successfully saved German history for airport ${airport.name}`);
          processedAny = true;
          await sleep(2000);
        }
      } catch (err) {
        log(`Error processing airport: ${err.message}`);
        await sleep(5000);
      }

      // If nothing left to process, stop loop
      if (!processedAny) {
        consecutiveEmptyRounds++;
        if (consecutiveEmptyRounds >= 3) {
          log("No more untranslated items found after 3 consecutive checks. All tasks completed! 🎉");
          active = false;
        } else {
          log(`No items found (check ${consecutiveEmptyRounds}/3). Waiting 10s before recheck...`);
          await sleep(10000);
        }
      } else {
        consecutiveEmptyRounds = 0;
        // Small cooldown between rounds
        await sleep(500);
      }
    }

  } catch (err) {
    log(`CRITICAL UNRECOVERABLE ERROR: ${err.message}`);
  } finally {
    await pool.end();
    log("Database pool closed.");
  }
}

main();
