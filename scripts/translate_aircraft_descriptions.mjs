import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize Supabase & Gemini client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function translateDescriptions() {
  console.log("🌍 Starting Aircraft Description Translation Protocol...");
  console.log("🤖 Initializing Gemini translation pipeline...");

  // Fetch aircraft models that lack Spanish or French descriptions, but have English descriptions
  const { data: aircrafts, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, description')
    .not('description', 'is', null)
    .not('description', 'eq', '')
    .or('description_es.is.null,description_es.eq.,description_fr.is.null,description_fr.eq.')
    .limit(15); // Process in small verified batches of 15

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return;
  }

  if (!aircrafts || aircrafts.length === 0) {
    console.log("✅ All loaded aircraft models are fully translated to Spanish and French!");
    return;
  }

  console.log(`📊 Found ${aircrafts.length} models requiring translation in this batch.`);

  for (let i = 0; i < aircrafts.length; i++) {
    const aircraft = aircrafts[i];
    console.log(`\n⏳ [${i + 1}/${aircrafts.length}] Translating descriptions for: ${aircraft.model_name}...`);

    try {
      const prompt = `You are a professional aviation translator. Translate the following English aircraft description into both Spanish (description_es) and French (description_fr).
Ensure the translations are accurate, technical, and premium.

Description to translate:
"${aircraft.description}"

Return ONLY a valid JSON object with the following structure:
{
  "description_es": "spanish translation here",
  "description_fr": "french translation here"
}

Do not include any markdown styling like \`\`\`json or explanation text. Return pure JSON string.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text;
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.description_es && parsed.description_fr) {
        console.log(`   es: "${parsed.description_es.substring(0, 50)}..."`);
        console.log(`   fr: "${parsed.description_fr.substring(0, 50)}..."`);

        // Save back to DB
        const { error: updateError } = await supabase
          .from('aircraft_models')
          .update({
            description_es: parsed.description_es,
            description_fr: parsed.description_fr
          })
          .eq('id', aircraft.id);

        if (updateError) {
          console.error(`   ❌ DB update error: ${updateError.message}`);
        } else {
          console.log(`   ✅ DB updated successfully.`);
        }
      } else {
        console.log(`   ⚠️ Invalid response format returned from Gemini.`);
      }
    } catch (e) {
      console.error(`   ❌ Failed translating model ${aircraft.model_name}:`, e.message);
    }

    // Delay 1.5s to respect rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\n🏁 Batch translation completed successfully.");
}

translateDescriptions();
