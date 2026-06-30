import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    
    console.log("Querying aircraft models for suspicious image URLs...");
    
    const query = `
      SELECT am.id, am.model_name, m.name as manufacturer_name, am.house_livery_url
      FROM aircraft_models am
      JOIN manufacturers m ON am.manufacturer_id = m.id
      WHERE am.house_livery_url IS NOT NULL 
        AND am.house_livery_url != 'NOT_FOUND_WIKI'
      ORDER BY m.name, am.model_name
    `;
    
    const res = await client.query(query);
    console.log(`Total aircraft models with images: ${res.rows.length}`);
    
    const suspicious = [];
    const keywords = [
      'logo', 'symbol', 'flag', 'map', 'coat_of_arms', 'crash', 'wreck', 'memorial', 'cemetery', 
      'disaster', 'accident', 'stamp', 'diagram', 'cockpit', 'cabin', 'interior', 'engine', 
      'schema', 'blueprint', 'drawing', 'badge', 'emblem', 'seal', 'monument', 'museum', 'portrait'
    ];
    
    for (const row of res.rows) {
      const urlLower = row.house_livery_url.toLowerCase();
      const matched = keywords.filter(kw => urlLower.includes(kw));
      if (matched.length > 0) {
        suspicious.push({
          id: row.id,
          name: `${row.manufacturer_name} ${row.model_name}`,
          url: row.house_livery_url,
          reasons: matched
        });
      }
    }
    
    console.log(`\nFound ${suspicious.length} suspicious URLs based on filename keywords:`);
    suspicious.forEach((item, idx) => {
      console.log(`[${idx+1}] ${item.name} (${item.id})`);
      console.log(`    URL: ${item.url}`);
      console.log(`    Keywords: ${item.reasons.join(', ')}`);
    });
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
