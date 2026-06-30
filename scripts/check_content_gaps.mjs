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
    console.log("Analyzing database content quality & translation gaps...\n");
    
    // --- 1. AIRCRAFT MODELS CONTENT ANALYSIS ---
    const aircraftCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'aircraft_models' AND table_schema = 'public'
    `);
    const amCols = aircraftCols.rows.map(r => r.column_name);
    
    const amTotal = await client.query("SELECT COUNT(*) FROM aircraft_models");
    const totalAM = parseInt(amTotal.rows[0].count);
    
    console.log("✈️ AIRCRAFT MODELS:");
    console.log(`- Totale record: ${totalAM}`);
    
    // Check missing default descriptions
    const amNoDesc = await client.query("SELECT COUNT(*) FROM aircraft_models WHERE description IS NULL OR description = ''");
    console.log(`- Senza descrizione di default (EN): ${amNoDesc.rows[0].count} (${Math.round((amNoDesc.rows[0].count/totalAM)*100)}%)`);
    
    // Check translation gaps
    if (amCols.includes('description_it')) {
      const amNoIt = await client.query("SELECT COUNT(*) FROM aircraft_models WHERE description_it IS NULL OR description_it = ''");
      console.log(`- Mancanti in Italiano (description_it): ${amNoIt.rows[0].count} (${Math.round((amNoIt.rows[0].count/totalAM)*100)}%)`);
    }
    if (amCols.includes('description_es')) {
      const amNoEs = await client.query("SELECT COUNT(*) FROM aircraft_models WHERE description_es IS NULL OR description_es = ''");
      console.log(`- Mancanti in Spagnolo (description_es): ${amNoEs.rows[0].count} (${Math.round((amNoEs.rows[0].count/totalAM)*100)}%)`);
    }
    if (amCols.includes('description_fr')) {
      const amNoFr = await client.query("SELECT COUNT(*) FROM aircraft_models WHERE description_fr IS NULL OR description_fr = ''");
      console.log(`- Mancanti in Francese (description_fr): ${amNoFr.rows[0].count} (${Math.round((amNoFr.rows[0].count/totalAM)*100)}%)`);
    }
    
    // --- 2. AIRLINES CONTENT ANALYSIS ---
    const airlineCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'airlines' AND table_schema = 'public'
    `);
    const alCols = airlineCols.rows.map(r => r.column_name);
    
    const alTotal = await client.query("SELECT COUNT(*) FROM airlines");
    const totalAL = parseInt(alTotal.rows[0].count);
    
    console.log("\n🏢 AIRLINES (COMPAGNIE AEREE):");
    console.log(`- Totale record: ${totalAL}`);
    
    const descCol = alCols.includes('history') ? 'history' : (alCols.includes('description') ? 'description' : null);
    if (descCol) {
      const alNoDesc = await client.query(`SELECT COUNT(*) FROM airlines WHERE ${descCol} IS NULL OR ${descCol} = ''`);
      console.log(`- Senza storia/descrizione di default (${descCol}): ${alNoDesc.rows[0].count} (${Math.round((alNoDesc.rows[0].count/totalAL)*100)}%)`);
      
      // Check for translation or fallback columns
      const itCol = `${descCol}_it`;
      if (alCols.includes(itCol)) {
        const alNoIt = await client.query(`SELECT COUNT(*) FROM airlines WHERE ${itCol} IS NULL OR ${itCol} = ''`);
        console.log(`- Mancanti in Italiano (${itCol}): ${alNoIt.rows[0].count} (${Math.round((alNoIt.rows[0].count/totalAL)*100)}%)`);
      }
      const esCol = `${descCol}_es`;
      if (alCols.includes(esCol)) {
        const alNoEs = await client.query(`SELECT COUNT(*) FROM airlines WHERE ${esCol} IS NULL OR ${esCol} = ''`);
        console.log(`- Mancanti in Spagnolo (${esCol}): ${alNoEs.rows[0].count} (${Math.round((alNoEs.rows[0].count/totalAL)*100)}%)`);
      }
      const frCol = `${descCol}_fr`;
      if (alCols.includes(frCol)) {
        const alNoFr = await client.query(`SELECT COUNT(*) FROM airlines WHERE ${frCol} IS NULL OR ${frCol} = ''`);
        console.log(`- Mancanti in Francese (${frCol}): ${alNoFr.rows[0].count} (${Math.round((alNoFr.rows[0].count/totalAL)*100)}%)`);
      }
    } else {
      console.log("- Nessuna colonna descrizione/storia trovata.");
    }
    
    // --- 3. AIRPORTS CONTENT ANALYSIS ---
    const airportCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'airports' AND table_schema = 'public'
    `);
    const apCols = airportCols.rows.map(r => r.column_name);
    
    const apTotal = await client.query("SELECT COUNT(*) FROM airports");
    const totalAP = parseInt(apTotal.rows[0].count);
    
    console.log("\n🌍 AIRPORTS (AEROPORTI):");
    console.log(`- Totale record: ${totalAP}`);
    
    const apDescCol = apCols.includes('history') ? 'history' : (apCols.includes('description') ? 'description' : null);
    if (apDescCol) {
      const apNoDesc = await client.query(`SELECT COUNT(*) FROM airports WHERE ${apDescCol} IS NULL OR ${apDescCol} = ''`);
      console.log(`- Senza storia/descrizione di default (${apDescCol}): ${apNoDesc.rows[0].count} (${Math.round((apNoDesc.rows[0].count/totalAP)*100)}%)`);
      
      const itCol = `${apDescCol}_it`;
      if (apCols.includes(itCol)) {
        const apNoIt = await client.query(`SELECT COUNT(*) FROM airports WHERE ${itCol} IS NULL OR ${itCol} = ''`);
        console.log(`- Mancanti in Italiano (${itCol}): ${apNoIt.rows[0].count} (${Math.round((apNoIt.rows[0].count/totalAP)*100)}%)`);
      }
      const esCol = `${apDescCol}_es`;
      if (apCols.includes(esCol)) {
        const apNoEs = await client.query(`SELECT COUNT(*) FROM airports WHERE ${esCol} IS NULL OR ${esCol} = ''`);
        console.log(`- Mancanti in Spagnolo (${esCol}): ${apNoEs.rows[0].count} (${Math.round((apNoEs.rows[0].count/totalAP)*100)}%)`);
      }
      const frCol = `${apDescCol}_fr`;
      if (apCols.includes(frCol)) {
        const apNoFr = await client.query(`SELECT COUNT(*) FROM airports WHERE ${frCol} IS NULL OR ${frCol} = ''`);
        console.log(`- Mancanti in Francese (${frCol}): ${apNoFr.rows[0].count} (${Math.round((apNoFr.rows[0].count/totalAP)*100)}%)`);
      }
    } else {
      console.log("- Nessuna colonna descrizione/storia trovata.");
    }
    
    // --- 4. ARTICLES CONTENT ANALYSIS ---
    const articleColsQuery = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'articles' AND table_schema = 'public'
    `);
    const artCols = articleColsQuery.rows.map(r => r.column_name);
    
    const artTotal = await client.query("SELECT COUNT(*) FROM articles");
    const totalArt = parseInt(artTotal.rows[0].count);
    
    console.log("\n📰 ARTICLES (BLOG/NEWS):");
    console.log(`- Totale record: ${totalArt}`);
    console.log(`- Colonne del database: ${artCols.join(', ')}`);
    
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
