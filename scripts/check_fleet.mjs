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
    
    // Count of fleets
    const countRes = await client.query('SELECT COUNT(*) FROM public.airline_fleet');
    console.log("Total rows in public.airline_fleet:", countRes.rows[0].count);

    // Count of airlines
    const airRes = await client.query('SELECT COUNT(*) FROM public.airlines');
    console.log("Total rows in public.airlines:", airRes.rows[0].count);

    // Count of aircraft models
    const amRes = await client.query('SELECT COUNT(*) FROM public.aircraft_models');
    console.log("Total rows in public.aircraft_models:", amRes.rows[0].count);
    
    // Distict statuses
    const statusRes = await client.query('SELECT status, COUNT(*) FROM public.airline_fleet GROUP BY status');
    console.log("\nStatus distribution in airline_fleet:");
    statusRes.rows.forEach(r => console.log(`- ${r.status}: ${r.count}`));

    
    // Search manufacturer info for models matching 170
    const matchRes = await client.query(`
      SELECT am.id, am.model_name, am.manufacturer_id, m.name as manufacturer_name
      FROM public.aircraft_models am
      LEFT JOIN public.manufacturers m ON am.manufacturer_id = m.id
      WHERE am.model_name ILIKE '%170%'
    `);
    console.log("\nModels matching 170 with manufacturer info:");
    matchRes.rows.forEach(r => console.log(`- ID: ${r.id} | Model: ${r.model_name} | Manufacturer ID: ${r.manufacturer_id} | Manufacturer Name: ${r.manufacturer_name}`));




    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
