import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Inizializzazione dei client
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseURL || !supabaseAnonKey || !geminiApiKey) {
  console.error("❌ Errore: Variabili d'ambiente mancanti in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseURL, supabaseAnonKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Analisi degli argomenti CLI
const args = process.argv.slice(2);
let targetType = 'aircraft'; // Valori possibili: aircraft, airport, airline
let limit = 5;               // Numero di elementi da elaborare per esecuzione
let forceUpdate = false;      // Se true, aggiorna anche record che hanno già descrizioni/storia

args.forEach(arg => {
  if (arg.startsWith('--type=')) {
    targetType = arg.split('=')[1].toLowerCase();
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--force') {
    forceUpdate = true;
  }
});

if (!['aircraft', 'airport', 'airline'].includes(targetType)) {
  console.error("❌ Errore: --type deve essere uno tra 'aircraft', 'airport' o 'airline'");
  process.exit(1);
}

console.log(`🤖 AirDex History Enhancer.`);
console.log(`Tipo target: ${targetType.toUpperCase()}`);
console.log(`Limite record: ${limit}`);
console.log(`Aggiornamento forzato: ${forceUpdate ? "SÌ" : "NO (solo record vuoti/corti)"}`);
console.log(`-----------------------------------------------`);

async function generateHistory(prompt, customConfig = {}) {
  let attempts = 0;
  let delay = 10000; // 10 secondi di base per riprovare in caso di rate limit

  while (attempts < 3) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          ...customConfig
        }
      });
      return response.text;
    } catch (e) {
      attempts++;
      console.warn(`⚠️ Errore API Gemini (Tentativo ${attempts}/3): ${e.message}`);
      if (attempts < 3) {
        console.log(`Raffreddamento d'emergenza: attesa di ${delay / 1000} secondi prima di riprovare...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // Raddoppia il tempo di attesa
      }
    }
  }
  throw new Error("Gemini API fallita dopo 3 tentativi consecutivi.");
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
Non aggiungere spiegazioni, non usare blocchi di codice markdown (tipo \`\`\`json). Restituisci esclusivamente il codice JSON valido.
Regola critica: NON utilizzare mai virgolette doppie (") all'interno delle stringhe tradotte. Se necessario, usa le virgolette singole ('). Le virgolette doppie sono riservate esclusivamente per le chiavi e i limiti delle stringhe del JSON.`;

  try {
    const responseText = await generateHistory(prompt);
    const cleanJSON = responseText.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();
    return JSON.parse(cleanJSON);
  } catch (e) {
    console.warn("⚠️ Impossibile tradurre le curiosità:", e.message);
    return null;
  }
}

async function enrichAircrafts() {
  const { data: records, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, first_flight_year, description, trivia, extended_stats, manufacturers(name)');

  if (error) {
    console.error("❌ Errore nel recupero dati Supabase:", error.message);
    return;
  }

  let filtered = records || [];
  if (!forceUpdate) {
    filtered = filtered.filter(r => !r.description || r.description.length < 500 || r.description.includes('...'));
  }

  const toProcess = filtered.slice(0, limit);

  if (toProcess.length === 0) {
    console.log("✅ Nessun aereo trovato da arricchire.");
    return;
  }

  console.log(`Trovati ${filtered.length} aerei con descrizione corta/mancante. Elaboro un blocco di ${toProcess.length} elementi.`);

  for (const item of toProcess) {
    const manufacturer = item.manufacturers?.name || 'Aviation';
    const fullName = `${manufacturer} ${item.model_name}`;
    const yearInfo = item.first_flight_year ? ` (Anno primo volo: ${item.first_flight_year})` : '';
    
    console.log(`\n⏳ Elaborazione: ${fullName}...`);

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

**Specifiche di Bordo:**
*   [Innovazione o specifica tecnica 1 in grassetto]
*   [Innovazione o specifica tecnica 2 in grassetto]
*   [Innovazione o specifica tecnica 3 in grassetto]

### Carriera Operativa & Vettori
[Inserisci qui la sezione carriera e aneddoti, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

### Eredità & Impatto Culturale
[Inserisci qui la sezione eredità storica, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

Evita l'uso di cancelletti diversi da "###". Non usare altri elementi di formattazione HTML o Markdown oltre a "###", elenchi puntati "*" e grassetti "**". Fornisci SOLO il testo strutturato come richiesto.`;

    try {
      const generatedText = await generateHistory(prompt);
      
      if (!generatedText || generatedText.trim().length < 300) {
        console.warn(`⚠️ Generazione troppo corta per ${fullName}, saltato.`);
        continue;
      }

      const cleanText = generatedText.trim();

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

      const { error: updateError } = await supabase
        .from('aircraft_models')
        .update({
          description: cleanText,
          description_it: cleanText,
          extended_stats: updatedStats
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ Errore salvataggio per ${fullName}:`, updateError.message);
      } else {
        console.log(`✅ ${fullName} arricchito con successo! (Lunghezza: ${cleanText.length} caratteri)`);
      }
    } catch (e) {
      console.error(`❌ Fallimento definitivo per ${fullName}:`, e.message);
    }

    // Delay di rispetto rate limits (15 secondi tra i record)
    console.log("🕒 Pausa di 15 secondi per rispetto dei rate limits API...");
    await new Promise(r => setTimeout(r, 15000));
  }
}

async function enrichAirports() {
  const { data: records, error } = await supabase
    .from('airports')
    .select('id, name, iata_code, icao_code, city, country, history, annual_passengers_mio, terminals_count, total_gates, atis_frequency, tower_frequency, runway_details');

  if (error) {
    console.error("❌ Errore nel recupero dati Supabase:", error.message);
    return;
  }

  let filtered = records || [];
  if (!forceUpdate) {
    // Treat as needing update if history is missing or short, OR if key details are missing
    filtered = filtered.filter(r => !r.history || r.history.length < 500 || !r.runway_details || !r.annual_passengers_mio);
  }

  const toProcess = filtered.slice(0, limit);

  if (toProcess.length === 0) {
    console.log("✅ Nessun aeroporto trovato da arricchire.");
    return;
  }

  console.log(`Trovati ${filtered.length} aeroporti con dati incompleti. Elaboro un blocco di ${toProcess.length} elementi.`);

  for (const item of toProcess) {
    const fullName = item.name;
    const iata = item.iata_code || 'N/A';
    const icao = item.icao_code || 'N/A';
    const location = `${item.city || ''}, ${item.country || ''}`.trim();
    
    console.log(`\n⏳ Elaborazione: ${fullName} (${iata}/${icao}) situato a ${location}...`);

    const prompt = `Fornisci informazioni storiche reali e dati tecnici aggiornati ed esatti per l'aeroporto: ${fullName} (${iata}/${icao}) situato a ${location}.
Usa Google Search per raccogliere i dati storici e operativi di questo aeroporto (es. da Wikipedia o siti ufficiali) ed evita assolutamente di allucinare numeri o dettagli inventati.

Rispondi esclusivamente in formato JSON con la seguente struttura, senza blocchi di codice markdown (NON usare \`\`\`json):
{
  "history_it": "Testo della storia dettagliato in italiano di circa 450-600 parole strutturato in paragrafi brevi divisi da linee vuote, suddivisi sotto le seguenti intestazioni ###:\\n\\n### Origini & Nascita dello Scalo\\n[Inserisci qui la sezione origini, 2 brevi paragrafi]\\n\\n### Evoluzione Infrastrutturale & Piste\\n[Inserisci qui la sezione tecnica delle piste, 2 brevi paragrafi]\\n\\n**Caratteristiche Infrastrutturali:**\\n* **Pista principale [identificativo pista, es. 09R/27L]** con fondo in [superficie, es. asfalto] e lunghezza di [lunghezza, es. 3800 metri]...\\n* **Terminal [numero o lettera Terminal]** dedicato a...\\n\\n### Ruolo Strategico & Traffico\\n[Inserisci qui la sezione traffico, 2 brevi paragrafi]\\n\\n### Eventi Memorabili & Stato Attuale\\n[Inserisci qui la sezione moderna, 2 brevi paragrafi]",
  "annual_passengers_mio": 45.2,
  "terminals_count": 3,
  "total_gates": 85,
  "atis_frequency": "132.45",
  "tower_frequency": "118.1",
  "runway_details": "09R/27L (3800m, Asfalto), 09L/27R (3500m, Calcestruzzo)"
}

Regole per il testo in history_it:
- Evidenzia in grassetto (usando **parola**) i concetti chiave, i nomi delle compagnie aeree principali (es. **Lufthansa**, **Alitalia**, **ITA Airways**, **Air France**, **Delta Air Lines**), i nomi dei modelli di aerei significativi (es. **Concorde**, **Boeing 747**, **Douglas DC-3**), i dati numerici e le milestones storiche. I nomi delle compagnie ed aeromobili in grassetto diventeranno link automatici!
- Mantieni un tono professionale e accurato dal punto di vista aeronautico.
- Non usare cancelletti diversi da "###". Non usare altri elementi di formattazione HTML o Markdown oltre a "###", elenchi puntati "*" e grassetti "**".
- Regola critica: NON utilizzare mai virgolette doppie (") all'interno delle stringhe dei valori di testo (history_it, runway_details). Se necessario, usa le virgolette singole ('). Le virgolette doppie sono riservate esclusivamente per delimitare le chiavi e i valori nel formato JSON.`;

    let responseText = '';
    try {
      responseText = await generateHistory(prompt);
      
      const cleanJSON = responseText.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();

      const data = JSON.parse(cleanJSON);

      if (!data.history_it || data.history_it.length < 300) {
        throw new Error("Dati storici insufficienti restituiti dall'AI");
      }

      const updateData = {
        history: data.history_it,
        history_it: data.history_it,
        runway_details: data.runway_details || item.runway_details
      };

      if (data.annual_passengers_mio !== undefined) updateData.annual_passengers_mio = data.annual_passengers_mio;
      if (data.terminals_count !== undefined) updateData.terminals_count = data.terminals_count;
      if (data.total_gates !== undefined) updateData.total_gates = data.total_gates;
      if (data.atis_frequency !== undefined) updateData.atis_frequency = data.atis_frequency;
      if (data.tower_frequency !== undefined) updateData.tower_frequency = data.tower_frequency;

      const { error: updateError } = await supabase
        .from('airports')
        .update(updateData)
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ Errore salvataggio per ${fullName}:`, updateError.message);
      } else {
        console.log(`✅ ${fullName} arricchito con successo!`);
        console.log(`  - Passeggeri: ${updateData.annual_passengers_mio || 'N/A'} Mln`);
        console.log(`  - Piste: ${updateData.runway_details || 'N/A'}`);
        console.log(`  - Frequenze: Tower: ${updateData.tower_frequency || 'N/A'} | ATIS: ${updateData.atis_frequency || 'N/A'}`);
      }
    } catch (e) {
      console.error(`❌ Fallimento definitivo per ${fullName}:`, e.message);
      if (responseText) {
        console.log("--- RAW RESPONSE FROM GEMINI ---");
        console.log(responseText);
        console.log("--------------------------------");
      }
    }

    // Delay di rispetto rate limits (15 secondi tra i record)
    console.log("🕒 Pausa di 15 secondi per rispetto dei rate limits API...");
    await new Promise(r => setTimeout(r, 15000));
  }
}

async function enrichAirlines() {
  const { data: records, error } = await supabase
    .from('airlines')
    .select('id, name, country, founded_year, history');

  if (error) {
    console.error("❌ Errore nel recupero dati Supabase:", error.message);
    return;
  }

  let filtered = records || [];
  if (!forceUpdate) {
    filtered = filtered.filter(r => !r.history || r.history.length < 500 || r.history.includes('...'));
  }

  const toProcess = filtered.slice(0, limit);

  if (toProcess.length === 0) {
    console.log("✅ Nessuna compagnia aerea trovata da arricchire.");
    return;
  }

  console.log(`Trovati ${filtered.length} compagnie con storia corta/mancante. Elaboro un blocco di ${toProcess.length} elementi.`);

  for (const item of toProcess) {
    const fullName = item.name;
    const foundation = item.founded_year ? ` (Fondata nel: ${item.founded_year})` : '';
    
    console.log(`\n⏳ Elaborazione: ${fullName}...`);

    const prompt = `Genera una storia in lingua italiana, estremamente dettagliata, approfondita e coinvolgente di circa 450-600 parole per la compagnia aerea: ${fullName}${foundation} della nazione: ${item.country || 'N/A'}.
La risposta deve seguire le migliori pratiche di scrittura per articoli SEO e divulgazione scientifica:
1. Struttura il testo in paragrafi brevi e agili (massimo 2-3 frasi o 60-80 parole per paragrafo) per rendere la lettura fluida e riposante.
2. Inserisci una linea vuota tra un paragrafo e l'altro.
3. Evidenzia in grassetto (usando **parola**) i concetti chiave, i dati numerici e i passaggi fondamentali per facilitare la scansione visiva del testo.
4. Mantieni un tono professionale, storico e avvincente.

Includi esattamente queste sezioni contrassegnate con "###":

### Fondazione & Primi Voli
[Inserisci qui la sezione origini, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

### Sviluppo della Flotta & Hub
[Inserisci qui la sezione flotta, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

**Punti di Forza del Vettore:**
*   [Dettaglio flotta o rotta 1 in grassetto]
*   [Dettaglio servizio o hub 2 in grassetto]
*   [Dettaglio posizionamento di mercato 3 in grassetto]

### Alleanze & Espansione Globale
[Inserisci qui la sezione espansione, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

### Identità del Brand & Eredità
[Inserisci qui la sezione marchio ed eredità, suddivisa in 2 o 3 brevi paragrafi intervallati da linee vuote]

Evita l'uso di cancelletti diversi da "###". Non usare altri elementi di formattazione HTML o Markdown oltre a "###", elenchi puntati "*" e grassetti "**". Fornisci SOLO il testo strutturato come richiesto.`;

    try {
      const generatedText = await generateHistory(prompt);
      
      if (!generatedText || generatedText.trim().length < 300) {
        console.warn(`⚠️ Generazione troppo corta per ${fullName}, saltato.`);
        continue;
      }

      const cleanText = generatedText.trim();

      const { error: updateError } = await supabase
        .from('airlines')
        .update({
          history: cleanText,
          history_it: cleanText
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ Errore salvataggio per ${fullName}:`, updateError.message);
      } else {
        console.log(`✅ ${fullName} arricchito con successo! (Lunghezza: ${cleanText.length} caratteri)`);
      }
    } catch (e) {
      console.error(`❌ Fallimento definitivo per ${fullName}:`, e.message);
    }

    // Delay di rispetto rate limits (15 secondi tra i record)
    console.log("🕒 Pausa di 15 secondi per rispetto dei rate limits API...");
    await new Promise(r => setTimeout(r, 15000));
  }
}

async function main() {
  try {
    if (targetType === 'aircraft') {
      await enrichAircrafts();
    } else if (targetType === 'airport') {
      await enrichAirports();
    } else if (targetType === 'airline') {
      await enrichAirlines();
    }
    console.log("\n🏁 Operazione di arricchimento completata per questo blocco.");
  } catch (e) {
    console.error("❌ Errore irreversibile nel thread principale:", e.message);
  }
}

main();
