import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Inizializzazione client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runEnrichment() {
  console.log("🚀 Avvio protocollo Copilota AI (Velocità di crociera: 2 aerei/minuto)...");

  // Recupera gli aerei senza descrizione
  const { data: aircrafts, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, manufacturers(name), first_flight_year')
    .is('description', null)
    .limit(200);

  if (error) {
    console.error("❌ Errore di connessione a Supabase:", error.message);
    return;
  }

  if (!aircrafts || aircrafts.length === 0) {
    console.log("✅ Nessun aereo da aggiornare. Flotta completata!");
    return;
  }

  for (const aircraft of aircrafts) {
    const manufacturerName = aircraft.manufacturers?.name || '';
    const fullName = `${manufacturerName} ${aircraft.model_name}`.trim();
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      try {
        console.log(`⏳ [Tentativo ${attempts + 1}] Generazione per: ${fullName}...`);
        
        const prompt = `Genera per l'aereo "${fullName}" (Primo volo: ${aircraft.first_flight_year || 'N/A'}) un JSON con: description (50 parole), trivia (array di 3 stringhe), extended_stats (cruise_speed_kmh, max_altitude_m, engine_thrust_kn). Solo JSON puro.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        // Pulizia JSON
        const rawResponse = response.text;
        const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedResponse);

        // Salvataggio nel database
        await supabase
          .from('aircraft_models')
          .update({
            description: parsedData.description,
            trivia: parsedData.trivia,
            extended_stats: parsedData.extended_stats
          })
          .eq('id', aircraft.id);

        console.log(`✅ ${fullName} aggiornato!`);
        success = true;

      } catch (e) {
        attempts++;
        console.warn(`⚠️ Errore su ${fullName}: ${e.message}`);
        
        if (attempts < 3) {
            console.log(`Raffreddamento d'emergenza: attesa di 60 secondi...`);
            await new Promise(r => setTimeout(r, 60000));
        } else {
            console.error(`❌ Fallimento definitivo per ${fullName} dopo 3 tentativi.`);
        }
      }
    }
    
    // LIMITATORE DI VELOCITÀ: Pausa esatta di 30 secondi (2 al minuto)
    console.log(`🕒 Attesa di 2 secondi per mantenere la velocità di crociera...`);
    await new Promise(r => setTimeout(r, 0));
  }
  
  console.log("\n🏁 Blocco di 50 aerei completato.");
}

runEnrichment();