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
    const result = await client.query(`
      SELECT id, model_name, status, description_it, description_en
      FROM public.aircraft_models 
      ORDER BY model_name
      LIMIT 30;
    `);
    console.log("Aircraft models list:");
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id} | Name: "${row.model_name}" | Status: ${row.status} | Has IT Desc: ${row.description_it !== null} | Has EN Desc: ${row.description_en !== null}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
