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
  
  console.log("Querying only required columns...");
  const t0 = Date.now();
  const selectRes = await client.query(`
    SELECT id, name, iata_code, icao_code, country, founded_year, closed_year, logo_url, alliance, main_hub, slogan, website, callsign
    FROM airlines
  `);
  console.log("Required columns fetched:", selectRes.rows.length, "Time:", Date.now() - t0, "ms");
  
  // Let's print one sample row keys and values to see if there are giant strings
  console.log("Sample:", selectRes.rows[0]);
  
  await client.end();
}
main();
