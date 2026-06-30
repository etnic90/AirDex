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

// Extractor of numbers from model name
function getNumbers(str) {
  return (str.match(/\d+/g) || []);
}

// Strictly verify if page title matches the aircraft model
function verifyTitleMatch(modelName, pageTitle) {
  const cleanModel = modelName.toLowerCase();
  const cleanTitle = pageTitle.toLowerCase();
  
  // Extract numbers
  const modelNumbers = getNumbers(cleanModel);
  const titleNumbers = getNumbers(cleanTitle);
  
  if (modelNumbers.length > 0) {
    // If the model name has numbers, at least one of those numbers must be in the page title
    const hasNumberMatch = modelNumbers.some(num => titleNumbers.includes(num) || cleanTitle.includes(num));
    if (!hasNumberMatch) return false;
  }
  
  // Also check if some core characters of the model name are in the title
  // e.g. for "Concorde" without numbers, the word must be present
  const modelWords = cleanModel.replace(/[^a-z]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  if (modelNumbers.length === 0 && modelWords.length > 0) {
    const hasWordMatch = modelWords.some(word => cleanTitle.includes(word));
    if (!hasWordMatch) return false;
  }
  
  return true;
}

async function getWikiImageVerified(manufacturer, modelName) {
  const queries = [
    `${manufacturer} ${modelName}`,
    `${modelName} aircraft`,
    `${manufacturer} ${modelName} aircraft`
  ];
  
  const aircraftKeywords = ["aircraft", "airplane", "airliner", "helicopter", "fighter", "biplane", "monoplane", "bomber", "transport", "glider", "flying boat", "prototype", "aviation", "aereo", "velivolo"];
  const crashKeywords = ["crash", "accident", "incident", "strage", "disastro", "hijacking", "shootdown", "collision"];

  for (const query of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages|extracts&exintro=true&explaintext=true&exchars=300&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
      const res = await fetch(url, { headers: WIKI_HEADERS });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.query || !data.query.pages) continue;

      const pages = Object.values(data.query.pages);
      pages.sort((a, b) => (a.index || 99) - (b.index || 99));

      for (const page of pages) {
        const title = page.title || "";
        const extract = page.extract || "";
        
        // 1. Verify title matches the model name
        if (!verifyTitleMatch(modelName, title) && !verifyTitleMatch(`${manufacturer} ${modelName}`, title)) {
          continue;
        }

        // 1.5. Verify manufacturer name (or synonyms) matches the page title or intro text
        const cleanMfr = manufacturer.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const mfrWords = cleanMfr.split(/\s+/).filter(w => w.length > 2);
        const titleLower = title.toLowerCase();
        const extractLower = extract.toLowerCase();
        
        let hasMfrMatch = mfrWords.some(word => titleLower.includes(word) || extractLower.includes(word));
        
        if (!hasMfrMatch) {
          const synonyms = {
            "aermacchi": ["macchi"],
            "sud aviation": ["aerospatiale", "aérospatiale"],
            "mcdonnell douglas": ["mcdonnell", "douglas"],
            "bae": ["british aerospace"],
            "convair": ["consolidated vultee"],
            "cessna": ["cessna"],
            "piper": ["piper"],
            "boeing": ["boeing"],
            "airbus": ["airbus"]
          };
          const key = manufacturer.toLowerCase().trim();
          const synList = synonyms[key] || [];
          const hasSynMatch = synList.some(syn => titleLower.includes(syn) || extractLower.includes(syn));
          if (!hasSynMatch) {
            continue; // Ignore this page if it belongs to a completely different manufacturer
          }
        }

        // 2. Verify it's not a crash article
        const isCrash = crashKeywords.some(kw => title.toLowerCase().includes(kw) || extract.toLowerCase().includes(kw));
        if (isCrash) continue;

        // 3. Verify it's an aircraft article
        const isAircraft = aircraftKeywords.some(kw => title.toLowerCase().includes(kw) || extract.toLowerCase().includes(kw));
        if (!isAircraft) continue;

        const img = page.original?.source || page.thumbnail?.source || null;
        if (img) {
          return {
            title,
            url: img
          };
        }
      }
    } catch (e) {
      console.error(`      Error querying query "${query}":`, e.message);
    }
  }
  return null;
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB. Scanning all aircraft models...");
    
    const res = await client.query(`
      SELECT am.id, am.model_name, m.name as manufacturer_name, am.house_livery_url, am.image_needs_review
      FROM aircraft_models am
      JOIN manufacturers m ON am.manufacturer_id = m.id
      ORDER BY m.name, am.model_name
    `);
    
    console.log(`Total aircraft models to verify: ${res.rows.length}`);
    
    let wrongImagesCount = 0;
    let updatedImagesCount = 0;
    
    for (let i = 0; i < res.rows.length; i++) {
      const row = res.rows[i];
      const fullName = `${row.manufacturer_name} ${row.model_name}`;
      console.log(`\n[${i+1}/${res.rows.length}] Verifying: ${fullName}`);
      
      const wikiResult = await getWikiImageVerified(row.manufacturer_name, row.model_name);
      
      if (!wikiResult) {
        // If we have an image in the DB, but strict verification found NO match,
        // it means the current image is highly suspicious (might be a false match from the previous run).
        if (row.house_livery_url && row.house_livery_url !== 'NOT_FOUND_WIKI') {
          console.log(`   ⚠️ SUSPICIOUS: Strict verification failed to find a valid Wiki page for "${fullName}". Current image might be wrong.`);
          console.log(`      Current URL: ${row.house_livery_url}`);
          
          await client.query(`
            UPDATE aircraft_models 
            SET image_needs_review = true 
            WHERE id = $1
          `, [row.id]);
          wrongImagesCount++;
        } else {
          console.log(`   ✅ OK: No image in DB and no verified page found on Wikipedia.`);
        }
      } else {
        console.log(`   ✨ Verified Wikipedia Page: "${wikiResult.title}"`);
        console.log(`      Wiki Image URL: ${wikiResult.url}`);
        
        // If the current image is NOT_FOUND_WIKI or it was marked as needing review,
        // let's update it with the verified image URL!
        const needsUpdate = !row.house_livery_url || row.house_livery_url === 'NOT_FOUND_WIKI' || row.image_needs_review;
        
        if (needsUpdate) {
          console.log(`      Updating DB image with verified Wikipedia URL...`);
          await client.query(`
            UPDATE aircraft_models 
            SET house_livery_url = $1, image_needs_review = false 
            WHERE id = $2
          `, [wikiResult.url, row.id]);
          updatedImagesCount++;
        } else {
          console.log(`   ✅ OK: Image is already verified.`);
        }
      }
      
      // Delay 1.2s to respect API guidelines
      await new Promise(r => setTimeout(r, 1200));
    }
    
    console.log(`\n🏁 Verification completed!`);
    console.log(`   Suspicious images flagged: ${wrongImagesCount}`);
    console.log(`   DB images updated/corrected: ${updatedImagesCount}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
