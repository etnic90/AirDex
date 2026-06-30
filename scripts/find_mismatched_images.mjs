import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

const WIKI_HEADERS = {
  "User-Agent": "AviationPokedexBot/3.0 (https://github.com/google/aviation-pokedex; mirko.admin@example.com)"
};

async function getWikiImage(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages|extracts&exintro=true&explaintext=true&exchars=300&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) {
      console.log(`      ⚠️ HTTP Error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    if (!data.query || !data.query.pages) {
      if (data.error) {
        console.log(`      ⚠️ Wiki API Error: ${JSON.stringify(data.error)}`);
      } else {
        console.log(`      ⚠️ Wiki Search: No pages found.`);
      }
      return null;
    }

    const pages = Object.values(data.query.pages);
    // Sort pages by index (search rank)
    pages.sort((a, b) => (a.index || 99) - (b.index || 99));

    const aircraftKeywords = ["aircraft", "airplane", "airliner", "helicopter", "fighter", "biplane", "monoplane", "bomber", "transport", "glider", "flying boat", "prototype", "aviation", "aereo", "velivolo"];
    const crashKeywords = ["crash", "accident", "incident", "strage", "disastro", "hijacking", "shootdown", "collision"];

    for (const page of pages) {
      const title = (page.title || "").toLowerCase();
      const extract = (page.extract || "").toLowerCase();

      // Check if title or extract contains crash keywords
      const isCrash = crashKeywords.some(kw => title.includes(kw) || extract.includes(kw));
      if (isCrash) {
        console.log(`      ↳ Skip page "${page.title}" (Reason: crash keyword matched)`);
        continue;
      }

      // Check if page contains aircraft keywords
      const isAircraft = aircraftKeywords.some(kw => title.includes(kw) || extract.includes(kw));
      if (!isAircraft) {
        console.log(`      ↳ Skip page "${page.title}" (Reason: not clearly an aircraft)`);
        continue;
      }

      const img = page.original?.source || page.thumbnail?.source || null;
      if (img) {
        return {
          title: page.title,
          url: img
        };
      }
    }
  } catch (err) {
    console.error(`      Wiki fetch error:`, err.message);
  }
  return null;
}

async function main() {
  try {
    await client.connect();
    
    console.log("Fetching aircraft models from DB...");
    const res = await client.query(`
      SELECT am.id, am.model_name, m.name as manufacturer_name, am.house_livery_url
      FROM aircraft_models am
      JOIN manufacturers m ON am.manufacturer_id = m.id
      ORDER BY m.name, am.model_name
    `);
    
    console.log(`Total aircraft models: ${res.rows.length}`);
    
    const candidates = res.rows.slice(0, 8); // Let's check the first 8 to see what we find
    
    for (const row of candidates) {
      const fullName = `${row.manufacturer_name} ${row.model_name}`;
      console.log(`\n🔍 Checking: ${fullName}`);
      console.log(`   Current DB URL: ${row.house_livery_url}`);
      
      const wikiResult = await getWikiImage(fullName);
      if (wikiResult) {
        console.log(`   Wikipedia matched page: "${wikiResult.title}"`);
        console.log(`   Wikipedia Image: ${wikiResult.url}`);
      } else {
        console.log(`   ❌ No valid Wikipedia page or image found.`);
      }
      
      // Aspetta 1.5 secondi per evitare rate limit
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
