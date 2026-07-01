import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
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

async function translateParagraph(text, targetLang, sourceLang = 'it') {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return data[0].map(item => item[0]).join('');
      }
    }
  } catch (e) {
    log(`Error translating paragraph: ${e.message}`);
  }
  return text; // fallback
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
    
    await new Promise(r => setTimeout(r, 100));
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
    
    await new Promise(r => setTimeout(r, 100));
  }

  return translated.join('\n');
}

async function main() {
  // Clear previous log file at start
  fs.writeFileSync(logFile, "=== TRANSLATION SYSTEM STARTED ===\n");
  log("Initializing connection to database...");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    log("Connected successfully. Scanning remaining tasks...");

    // Get count of remaining items
    const countRes = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM aircraft_models WHERE description_it IS NOT NULL AND description_it <> '' AND (description_en IS NULL OR description_de IS NULL OR description_es IS NULL OR description_fr IS NULL)) as planes,
        (SELECT COUNT(*) FROM airlines WHERE history_en IS NOT NULL AND history_en <> '' AND history_de IS NULL) as airlines,
        (SELECT COUNT(*) FROM airports WHERE history_en IS NOT NULL AND history_en <> '' AND history_de IS NULL) as airports
    `);
    const stats = countRes.rows[0];
    log(`Initial remaining to translate: Planes=${stats.planes}, Airlines=${stats.airlines}, Airports=${stats.airports}`);

    let active = true;

    while (active) {
      let processedAny = false;

      // 1. Process 1 Aircraft Model
      const planeRes = await client.query(`
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

        await client.query(`
          UPDATE aircraft_models
          SET description_en = $1, description_es = $2, description_fr = $3, description_de = $4
          WHERE id = $5
        `, [descEn, descEs, descFr, descDe, aircraft.id]);
        log(`Successfully saved translations for ${aircraft.model_name}`);
        processedAny = true;
        await new Promise(r => setTimeout(r, 2000));
      }

      // 2. Process 2 Airlines to German
      const airlineRes = await client.query(`
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
        await client.query(`
          UPDATE airlines SET history_de = $1 WHERE id = $2
        `, [historyDe, airline.id]);
        log(`Successfully saved German history for airline ${airline.name}`);
        processedAny = true;
        await new Promise(r => setTimeout(r, 2000));
      }

      // 3. Process 2 Airports to German
      const airportRes = await client.query(`
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
        await client.query(`
          UPDATE airports SET history_de = $1 WHERE id = $2
        `, [historyDe, airport.id]);
        log(`Successfully saved German history for airport ${airport.name}`);
        processedAny = true;
        await new Promise(r => setTimeout(r, 2000));
      }

      // If nothing left to process, stop loop
      if (!processedAny) {
        log("No more untranslated items found. All tasks completed!");
        active = false;
      }

      // Small cooldown between rounds
      await new Promise(r => setTimeout(r, 3000));
    }

  } catch (err) {
    log(`CRITICAL DATABASE EXCEPTION: ${err.message}`);
  } finally {
    await client.end();
    log("Database connection closed.");
  }
}

main();
