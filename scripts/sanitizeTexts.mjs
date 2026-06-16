import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Inizializzazione client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Funzione di pulizia tramite espressioni regolari
function sanitizeString(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]*>?/gm, '') // Rimuove qualsiasi tag HTML orfano
    .replace(/\*\*/g, '')      // Rimuove il bold di Markdown (**)
    .replace(/\*/g, '')        // Rimuove l'italic/liste di Markdown (*)
    .replace(/#{1,6}\s?/g, '') // Rimuove gli header di Markdown (#, ##, ecc.)
    .replace(/`/g, '')         // Rimuove i backtick (`)
    .trim();                   // Rimuove spazi vuoti all'inizio e alla fine
}

async function runSanitization() {
  console.log("🧹 Avvio protocollo di sanitizzazione testi (Rimozione artefatti AI)...");

  // Recupera tutti gli aerei che hanno una descrizione
  const { data: aircrafts, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, description, trivia')
    .not('description', 'is', null);

  if (error) {
    console.error("❌ Errore di connessione a Supabase:", error.message);
    return;
  }

  if (!aircrafts || aircrafts.length === 0) {
    console.log("✅ Nessun dato da sanitizzare.");
    return;
  }

  let updatedCount = 0;

  for (const aircraft of aircrafts) {
    let needsUpdate = false;
    
    // Pulisce la descrizione
    const cleanDescription = sanitizeString(aircraft.description);
    if (cleanDescription !== aircraft.description) {
      needsUpdate = true;
    }

    // Pulisce i trivia (essendo un array, mappiamo ogni stringa)
    let cleanTrivia = aircraft.trivia;
    if (Array.isArray(aircraft.trivia)) {
      cleanTrivia = aircraft.trivia.map(t => sanitizeString(t));
      
      // Verifica se c'è stata una modifica reale confrontando gli array serializzati
      if (JSON.stringify(cleanTrivia) !== JSON.stringify(aircraft.trivia)) {
        needsUpdate = true;
      }
    }

    // Se abbiamo trovato e rimosso artefatti, aggiorniamo il record
    if (needsUpdate) {
      console.log(`🔧 Pulizia record: ${aircraft.model_name}...`);
      const { error: updateError } = await supabase
        .from('aircraft_models')
        .update({
          description: cleanDescription,
          trivia: cleanTrivia
        })
        .eq('id', aircraft.id);

      if (updateError) {
        console.error(`❌ Errore aggiornamento ${aircraft.model_name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\n🏁 Protocollo completato. Sanitizzati ${updatedCount} record su ${aircrafts.length} totali verificati.`);
}

runSanitization();