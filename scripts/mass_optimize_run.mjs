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
const progressFile = resolve(__dirname, '../scratch/mass_optimize_progress.json');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Strictly validate that there are no stray '#' or markdown links
function validateAndCleanText(text) {
  // 1. Remove raw markdown links: [Text](file://...) -> **Text**
  let cleaned = text.replace(/\[([^\]]+)\]\(file:\/\/\/[^\)]+\)/g, '**$1**');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '**$1**'); // Fallback for any standard links too
  
  // 2. Validate hash characters
  const lines = cleaned.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('#')) {
      const trimmed = line.trim();
      const isValidHeading = /^###\s+[^#]+$/.test(trimmed) || /^####\s+[^#]+$/.test(trimmed);
      if (!isValidHeading) {
        throw new Error(`Invalid '#' character found in line ${index + 1}: "${line}"`);
      }
    }
  });

  return cleaned;
}

async function generateHistory(prompt) {
  let attempts = 0;
  let delay = 10000;
  while (attempts < 3) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      attempts++;
      console.warn(`⚠️ Gemini API error (Attempt ${attempts}/3): ${e.message}`);
      if (attempts < 3) {
        await sleep(delay);
        delay *= 2;
      }
    }
  }
  throw new Error("Gemini API failed after 3 attempts.");
}

async function translateTrivia(triviaArray) {
  if (!Array.isArray(triviaArray) || triviaArray.length === 0) return null;
  
  const prompt = `Traduci le seguenti curiosità aeronautiche (in formato array JSON) dall'inglese all'italiano (it), allo spagnolo (es) e al francese (fr). Mantieni lo stesso significato tecnico accurato.
Input: ${JSON.stringify(triviaArray)}

Rispondi SOLO con un oggetto JSON valido avente la seguente struttura:
{
  "trivia_it": ["...", "..."],
  "trivia_es": ["...", "..."],
  "trivia_fr": ["...", "..."]
}
Non aggiungere spiegazioni, non usare blocchi di codice markdown (tipo \`\`\`json). Restituisci esclusivamente il codice JSON valido.`;

  try {
    const responseText = await generateHistory(prompt);
    const cleanJSON = responseText.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();
    return JSON.parse(cleanJSON);
  } catch (e) {
    console.warn("⚠️ Trivia translation failed:", e.message);
    return null;
  }
}

async function main() {
  try {
    await client.connect();
    
    // Fetch all unoptimized records
    const selectRes = await client.query(`
      SELECT am.id, am.model_name, am.first_flight_year, am.description, am.description_it, am.trivia, am.extended_stats, m.name as manufacturer_name
      FROM public.aircraft_models am
      LEFT JOIN public.manufacturers m ON am.manufacturer_id = m.id;
    `);

    const records = selectRes.rows;
    const toOptimize = records.filter(r => {
      const desc = r.description_it;
      return !(desc && desc.includes('### Architettura & Design Tecnologico'));
    });

    console.log(`Found ${toOptimize.length} aircraft models to optimize.`);

    let total = 415;
    let processed = 415 - toOptimize.length;
    let success = processed;
    let errors = 0;

    if (fs.existsSync(progressFile)) {
      try {
        const prevStatus = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        if (prevStatus.total && prevStatus.processed !== undefined) {
          total = prevStatus.total;
          processed = prevStatus.processed;
          success = prevStatus.success !== undefined ? prevStatus.success : processed;
          errors = prevStatus.errors !== undefined ? prevStatus.errors : 0;
        }
      } catch (e) {
        console.warn("Could not read previous progress file, using default calculation.");
      }
    }

    const status = {
      total,
      processed,
      success,
      errors,
      currentModel: '',
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    fs.mkdirSync(dirname(progressFile), { recursive: true });
    fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

    for (const item of toOptimize) {
      status.currentModel = `${item.manufacturer_name || ''} ${item.model_name}`;
      status.lastUpdate = new Date().toISOString();
      fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

      console.log(`\n[${status.processed + 1}/${status.total}] Processing: ${status.currentModel}...`);
      
      const manufacturer = item.manufacturer_name || 'Aviation';
      const fullName = `${manufacturer} ${item.model_name}`;
      const yearInfo = item.first_flight_year ? ` (Anno primo volo: ${item.first_flight_year})` : '';

      const prompt = `Genera una descrizione storica e tecnica in lingua italiana, estremamente dettagliata, approfondita e coinvolgente di circa 450-600 parole per l'aereo: ${fullName}${yearInfo}.
La risposta deve seguire le migliori pratiche di scrittura per articoli SEO e divulgazione scientifica:
1. Struttura il testo in paragrafi brevi e agili (massimo 2-3 frasi o 60-80 parole per paragrafo) per rendere la lettura fluida e riposante.
2. Inserisci una linea vuota tra un paragrafo e l'altro.
3. Evidenzia in grassetto (usando **parola**) i concetti chiave, i dati numerici e i passaggi fondamentali per facilitare la scansione visiva del testo.
4. Mantieni un tono professionale ma estremamente appassionante per i lettori di aeronautica.

Includi esattamente queste sezioni contrassegnate con "###":

### Contesto Storico & Origini
[Inserisci qui la sezione origini, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

### Architettura & Design Tecnologico
[Inserisci qui la sezione tecnologica, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

#### Specifiche di Bordo
*   [Innovazione o specifica tecnica 1 in grassetto]
*   [Innovazione o specifica tecnica 2 in grassetto]
*   [Innovazione o specifica tecnica 3 in grassetto]

### Carriera Operativa & Vettori
[Inserisci qui la sezione carriera e aneddoti, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

### Eredità & Impatto Culturale
[Inserisci qui la sezione eredità storica, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

Evita l'uso di cancelletti diversi da "###" e "####" (ad es. non usare "# " singolo). Non usare altri elementi di formattazione HTML o Markdown oltre a "###", "####", elenchi puntati "*" e grassetti "**". Fornisci SOLO il testo strutturato come richiesto.`;

      try {
        let text = await generateHistory(prompt);
        if (!text || text.trim().length < 300) {
          throw new Error("Generated text was too short.");
        }

        // Apply strict formatting validation & link cleanup
        let cleanText = validateAndCleanText(text.trim());

        // Translate trivia
        const translations = await translateTrivia(item.trivia);
        const currentStats = typeof item.extended_stats === 'object' && item.extended_stats !== null
          ? item.extended_stats
          : {};
        
        const updatedStats = translations 
          ? {
              ...currentStats,
              trivia_it: translations.trivia_it || [],
              trivia_es: translations.trivia_es || [],
              trivia_fr: translations.trivia_fr || []
            }
          : currentStats;

        // Save to DB
        await client.query(`
          UPDATE public.aircraft_models
          SET description_it = $1, description = $1, extended_stats = $2
          WHERE id = $3;
        `, [cleanText, JSON.stringify(updatedStats), item.id]);

        console.log(`✅ Success: ${fullName}`);
        status.success++;
      } catch (err) {
        console.error(`❌ Error for ${fullName}:`, err.message);
        status.errors++;
      }

      status.processed++;
      status.lastUpdate = new Date().toISOString();
      fs.writeFileSync(progressFile, JSON.stringify(status, null, 2));

      // 5 seconds sleep between items to remain under rate limits
      await sleep(5000);
    }

    console.log("\n🏁 Mass optimization finished!");
  } catch (err) {
    console.error("Irreversible error:", err);
  } finally {
    await client.end();
  }
}

main();
