import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

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

    console.log("=== CHECKING SILVER AIRLINES ===");
    const silverRes = await client.query(`
      SELECT id, name, iata_code, country FROM public.airlines
      WHERE name ILIKE '%silver%'
    `);
    console.log("Airlines matching 'silver':");
    console.log(silverRes.rows);

    console.log("=== CHECKING ITA/ITAVIA ===");
    const itaRes = await client.query(`
      SELECT id, name, iata_code, country FROM public.airlines
      WHERE name ILIKE '%ita%' OR name ILIKE '%italia%'
    `);
    console.log("Airlines matching 'ita' or 'italia':");
    console.log(itaRes.rows);

    console.log("\n=== CHECKING BRISTOL MODELS ===");
    const bristolRes = await client.query(`
      SELECT am.id, am.model_name, m.name as manufacturer_name
      FROM public.aircraft_models am
      LEFT JOIN public.manufacturers m ON m.id = am.manufacturer_id
      WHERE am.model_name ILIKE '%bristol%' OR m.name ILIKE '%bristol%'
    `);
    console.log("Bristol models in DB:", bristolRes.rows);

    const bristolIds = bristolRes.rows.map(r => r.id);
    if (bristolIds.length > 0) {
      console.log("\n=== FLEET FOR BRISTOL MODELS ===");
      const bristolFleetRes = await client.query(`
        SELECT f.qty, f.status, a.name as airline_name, am.model_name, m.name as manufacturer_name
        FROM public.airline_fleet f
        JOIN public.airlines a ON a.id = f.airline_id
        JOIN public.aircraft_models am ON am.id = f.aircraft_model_id
        LEFT JOIN public.manufacturers m ON m.id = am.manufacturer_id
        WHERE f.aircraft_model_id = ANY($1)
      `, [bristolIds]);
      console.log("Fleet for Bristol models:");
      console.log(bristolFleetRes.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
