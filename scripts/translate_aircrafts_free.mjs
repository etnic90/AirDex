import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

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

async function translateParagraph(text, targetLang) {
  if (!text) return "";
  
  // Clean markdown bold tags if any, but try to preserve
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
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
    console.error(`      Error translating paragraph:`, e.message);
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

    // Check if it is a standard heading
    if (trimmed.startsWith('#')) {
      const standardHeading = headingTranslations[targetLang]?.[trimmed];
      if (standardHeading) {
        translated.push(standardHeading);
      } else {
        // Fallback translate heading
        const headingText = trimmed.replace(/^#+\s+/, '');
        const hashPrefix = trimmed.match(/^#+/)[0];
        const translatedHeadingText = await translateParagraph(headingText, targetLang);
        translated.push(`${hashPrefix} ${translatedHeadingText}`);
      }
      continue;
    }

    // Standard paragraph or list item
    if (trimmed.startsWith('*')) {
      const listText = trimmed.replace(/^\*\s+/, '');
      const translatedListText = await translateParagraph(listText, targetLang);
      translated.push(`*   ${translatedListText}`);
    } else {
      const translatedText = await translateParagraph(trimmed, targetLang);
      translated.push(translatedText);
    }
    
    // Quick delay to avoid rate limits
    await new Promise(r => setTimeout(r, 60));
  }

  return translated.join('\n');
}

async function main() {
  try {
    await client.connect();
    console.log("✈️ Starting Free Aircraft Description Translation Protocol...");
    
    const limit = process.argv[2] ? parseInt(process.argv[2], 10) : 25;
    
    // Fetch aircraft models that lack English or German translations
    const res = await client.query(`
      SELECT id, model_name, description_it
      FROM aircraft_models
      WHERE description_it IS NOT NULL 
        AND description_it <> ''
        AND (description_en IS NULL OR description_de IS NULL OR description_es IS NULL OR description_fr IS NULL)
      LIMIT $1
    `, [limit]);
    
    const aircrafts = res.rows;
    if (aircrafts.length === 0) {
      console.log("✅ All aircraft models are fully translated!");
      return;
    }

    console.log(`📊 Found ${aircrafts.length} models to translate in this batch.`);

    for (let i = 0; i < aircrafts.length; i++) {
      const aircraft = aircrafts[i];
      console.log(`\n⏳ [${i+1}/${aircrafts.length}] Translating: ${aircraft.model_name}...`);

      const descEn = await translateFullDescription(aircraft.description_it, 'en');
      console.log("   -> Translated to English");
      const descEs = await translateFullDescription(aircraft.description_it, 'es');
      console.log("   -> Translated to Spanish");
      const descFr = await translateFullDescription(aircraft.description_it, 'fr');
      console.log("   -> Translated to French");
      const descDe = await translateFullDescription(aircraft.description_it, 'de');
      console.log("   -> Translated to German");

      const updateRes = await client.query(`
        UPDATE aircraft_models
        SET description_en = $1,
            description_es = $2,
            description_fr = $3,
            description_de = $4
        WHERE id = $5
      `, [descEn, descEs, descFr, descDe, aircraft.id]);

      if (updateRes.rowCount > 0) {
        console.log(`   ✅ DB updated successfully for ${aircraft.model_name}!`);
      } else {
        console.error(`   ❌ Failed to update DB for ${aircraft.model_name}`);
      }

      // Small delay between aircraft models
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log("\n🏁 Batch translation finished successfully!");
  } catch (err) {
    console.error("Critical error:", err.message);
  } finally {
    await client.end();
  }
}

main();
