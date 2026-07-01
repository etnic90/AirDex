import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize clients
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function translateAircrafts() {
  console.log("🌍 Starting Full Aircraft Description Translation Protocol...");
  
  // Fetch aircraft models that lack English or German translations
  const { data: aircrafts, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, description_it')
    .not('description_it', 'is', null)
    .not('description_it', 'eq', '')
    .or('description_en.is.null,description_de.is.null,description_es.is.null,description_fr.is.null')
    .limit(20); // Process in batches of 20 to avoid timeouts and rate-limits

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return;
  }

  if (!aircrafts || aircrafts.length === 0) {
    console.log("✅ All aircraft models are fully translated to English, Spanish, French, and German!");
    return;
  }

  console.log(`📊 Found ${aircrafts.length} models requiring translations in this batch.`);

  for (let i = 0; i < aircrafts.length; i++) {
    const aircraft = aircrafts[i];
    console.log(`\n⏳ [${i + 1}/${aircrafts.length}] Translating model: ${aircraft.model_name}...`);

    try {
      const prompt = `You are a professional aviation translator. Translate the following Italian aircraft description into English (description_en), Spanish (description_es), French (description_fr), and German (description_de).
Ensure the translations are accurate, technical, and premium. Preserve the markdown heading structure exactly.

Description to translate:
"${aircraft.description_it}"

Return ONLY a valid JSON object with the following structure:
{
  "description_en": "english translation",
  "description_es": "spanish translation",
  "description_fr": "french translation",
  "description_de": "german translation"
}

Do not include any markdown styling like \`\`\`json or explanation text. Return pure JSON string.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.description_en && parsed.description_de && parsed.description_es && parsed.description_fr) {
        // Save back to DB
        const { error: updateError } = await supabase
          .from('aircraft_models')
          .update({
            description_en: parsed.description_en,
            description_es: parsed.description_es,
            description_fr: parsed.description_fr,
            description_de: parsed.description_de
          })
          .eq('id', aircraft.id);

        if (updateError) {
          console.error(`   ❌ DB update error: ${updateError.message}`);
        } else {
          console.log(`   ✅ DB updated successfully for EN, ES, FR, DE.`);
        }
      } else {
        console.log(`   ⚠️ Invalid response format returned from Gemini.`);
      }
    } catch (e) {
      console.error(`   ❌ Failed translating model ${aircraft.model_name}:`, e.message);
    }

    // Delay to respect rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n🏁 Batch translation completed successfully.");
}

translateAircrafts();
