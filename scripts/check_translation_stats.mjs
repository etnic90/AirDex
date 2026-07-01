import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  
  const resPlanes = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(description_it) as has_it,
      COUNT(description_en) as has_en,
      COUNT(description_es) as has_es,
      COUNT(description_fr) as has_fr
    FROM aircraft_models
  `);
  console.log("=== Aircraft Model Translations ===");
  console.log(resPlanes.rows[0]);

  const resAirlines = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(history_it) as has_it,
      COUNT(history_en) as has_en,
      COUNT(history_es) as has_es,
      COUNT(history_fr) as has_fr
    FROM airlines
  `);
  console.log("=== Airline Translations ===");
  console.log(resAirlines.rows[0]);

  const resAirports = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(history_it) as has_it,
      COUNT(history_en) as has_en,
      COUNT(history_es) as has_es,
      COUNT(history_fr) as has_fr
    FROM airports
  `);
  console.log("=== Airport Translations ===");
  console.log(resAirports.rows[0]);

  await client.end();
}
main();
