import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

function isEnglish(text) {
  if (!text) return false;
  const clean = text.toLowerCase();
  
  // Count occurrences of common English function words vs Italian function words
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

async function main() {
  try {
    await client.connect();
    
    console.log("Analyzing aircraft descriptions in aircraft_models for English text inside description_it...");
    const resAM = await client.query("SELECT id, model_name, description_it, description_en, description FROM aircraft_models");
    
    let amCount = 0;
    resAM.rows.forEach(row => {
      if (isEnglish(row.description_it)) {
        console.log(`[Aereo] ${row.model_name} (${row.id})`);
        console.log(`        Descrizione IT: "${row.description_it.substring(0, 100)}..."`);
        amCount++;
      }
    });
    console.log(`Total aircraft models with English text in description_it: ${amCount}`);
    
    console.log("\nAnalyzing airline histories in airlines for English text inside history_it...");
    const resAL = await client.query("SELECT id, name, history_it FROM airlines");
    let alCount = 0;
    resAL.rows.forEach(row => {
      if (isEnglish(row.history_it)) {
        console.log(`[Compagnia] ${row.name} (${row.id})`);
        console.log(`            Storia IT: "${row.history_it.substring(0, 100)}..."`);
        alCount++;
      }
    });
    console.log(`Total airlines with English text in history_it: ${alCount}`);
    
    console.log("\nAnalyzing airport histories in airports for English text inside history_it...");
    const resAP = await client.query("SELECT id, name, history_it FROM airports");
    let apCount = 0;
    resAP.rows.forEach(row => {
      if (isEnglish(row.history_it)) {
        console.log(`[Aeroporto] ${row.name} (${row.id})`);
        console.log(`            Storia IT: "${row.history_it.substring(0, 100)}..."`);
        apCount++;
      }
    });
    console.log(`Total airports with English text in history_it: ${apCount}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
