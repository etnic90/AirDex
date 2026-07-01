import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function translateParagraph(text) {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=de&dt=t&q=${encodeURIComponent(text)}`;
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
      // Keep headings but translate text
      const headingText = trimmed.replace(/^#+\s+/, '');
      const hashPrefix = trimmed.match(/^#+/)[0];
      const translatedHeadingText = await translateParagraph(headingText);
      translated.push(`${hashPrefix} ${translatedHeadingText}`);
      continue;
    }

    const translatedText = await translateParagraph(trimmed);
    translated.push(translatedText);
    
    // Respect API rate limits
    await new Promise(r => setTimeout(r, 60));
  }

  return translated.join('\n');
}

async function main() {
  try {
    await client.connect();
    const mode = process.argv[2] || 'all'; // 'airlines', 'airports', or 'all'
    const limit = process.argv[3] ? parseInt(process.argv[3], 10) : 25;

    console.log(`🌍 Starting German Translation Protocol (Mode: ${mode}, Limit: ${limit})...`);

    if (mode === 'all' || mode === 'airlines') {
      console.log("\n✈️ Processing Airlines...");
      const res = await client.query(`
        SELECT id, name, history_en 
        FROM airlines 
        WHERE history_en IS NOT NULL 
          AND history_en <> '' 
          AND history_de IS NULL
        LIMIT $1
      `, [limit]);

      console.log(`Found ${res.rows.length} airlines requiring German history.`);
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows[i];
        console.log(`[${i+1}/${res.rows.length}] Translating airline: ${row.name}...`);
        const historyDe = await translateHistoryToGerman(row.history_en);
        await client.query(`
          UPDATE airlines SET history_de = $1 WHERE id = $2
        `, [historyDe, row.id]);
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (mode === 'all' || mode === 'airports') {
      console.log("\n⚓ Processing Airports...");
      const res = await client.query(`
        SELECT id, name, history_en 
        FROM airports 
        WHERE history_en IS NOT NULL 
          AND history_en <> '' 
          AND history_de IS NULL
        LIMIT $1
      `, [limit]);

      console.log(`Found ${res.rows.length} airports requiring German history.`);
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows[i];
        console.log(`[${i+1}/${res.rows.length}] Translating airport: ${row.name}...`);
        const historyDe = await translateHistoryToGerman(row.history_en);
        await client.query(`
          UPDATE airports SET history_de = $1 WHERE id = $2
        `, [historyDe, row.id]);
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log("\n🏁 German Translation Batch Complete!");
  } catch (err) {
    console.error("Critical error:", err.message);
  } finally {
    await client.end();
  }
}

main();
