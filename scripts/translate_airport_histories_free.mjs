import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

// Heuristic to check if text is English
function isEnglish(text) {
  if (!text) return false;
  const clean = text.toLowerCase();
  
  const enWords = [' the ', ' and ', ' is ', ' of ', ' with ', ' for ', ' by ', ' from ', ' was ', ' aircraft ', ' flight '];
  const itWords = [' il ', ' la ', ' di ', ' con ', ' per ', ' da ', ' era ', ' aereo ', ' volo '];
  
  let enScore = 0;
  let itScore = 0;
  
  enWords.forEach(w => {
    const matches = clean.split(w).length - 1;
    enScore += matches;
  });
  
  itWords.forEach(w => {
    const matches = clean.split(w).length - 1;
    itScore += matches;
  });
  
  return enScore > itScore && enScore > 1;
}

// Free Google Translate API call
async function translateTextFree(text) {
  if (!text) return "";
  
  const paragraphs = text.split('\n');
  const translatedParagraphs = [];
  
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      translatedParagraphs.push("");
      continue;
    }
    
    // Preserve Markdown headings
    if (trimmed.startsWith('#')) {
      // e.g. "### Origini & Nascita dello Scalo" -> Keep it
      translatedParagraphs.push(trimmed);
      continue;
    }
    
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=it&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const translatedPara = data[0].map(item => item[0]).join('');
          translatedParagraphs.push(translatedPara);
        } else {
          translatedParagraphs.push(trimmed);
        }
      } else {
        translatedParagraphs.push(trimmed);
      }
    } catch (e) {
      console.error(`      Error translating paragraph:`, e.message);
      translatedParagraphs.push(trimmed);
    }
    
    // Mini delay to avoid Google Translate rate limits
    await new Promise(r => setTimeout(r, 150));
  }
  
  return translatedParagraphs.join('\n');
}

async function main() {
  try {
    await client.connect();
    console.log("✈️ Starting Free Airport History Translation Protocol...");
    console.log("🤖 Scanning for airport records with English content in history_it...");
    
    const resAP = await client.query("SELECT id, name, history_it FROM airports");
    const targets = [];
    
    resAP.rows.forEach(row => {
      if (isEnglish(row.history_it)) {
        targets.push(row);
      }
    });
    
    console.log(`📊 Found ${targets.length} airports with English text in history_it.`);
    
    if (targets.length === 0) {
      console.log("✅ All airport histories are already in Italian!");
      return;
    }
    
    // We will translate a batch of 35 records to verify and seed
    const batchLimit = 35;
    const batch = targets.slice(0, batchLimit);
    console.log(`⏳ Processing a test batch of ${batch.length} airports...`);
    
    let successes = 0;
    
    for (let i = 0; i < batch.length; i++) {
      const airport = batch[i];
      console.log(`\n[${i+1}/${batch.length}] Translating history for: ${airport.name}...`);
      
      const originalText = airport.history_it;
      const translatedText = await translateTextFree(originalText);
      
      if (translatedText && translatedText !== originalText) {
        const { error } = await client.query(`
          UPDATE airports 
          SET history_it = $1 
          WHERE id = $2
        `, [translatedText, airport.id]);
        
        if (error) {
          console.error(`   ❌ Failed to update DB:`, error.message);
        } else {
          console.log(`   ✅ DB updated successfully.`);
          successes++;
        }
      } else {
        console.log(`   ⚠️ Translation returned empty or unchanged text.`);
      }
      
      // Delay between airports to be gentle with Google Translate
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log(`\n🏁 Test batch completed! Successfully translated ${successes} out of ${batch.length} airports.`);
    console.log(`💡 To translate the remaining ${targets.length - batch.length} airports, you can run the script again or raise the batchLimit.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
