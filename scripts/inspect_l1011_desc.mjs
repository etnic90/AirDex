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
      SELECT description_it, description
      FROM public.aircraft_models
      WHERE id = '9b8c852b-5aba-4641-989d-7a67a8cdad92';
    `);
    
    console.log("--- Lockheed L-1011-100 description_it ---");
    console.log(result.rows[0].description_it);
    console.log("--- Lockheed L-1011-100 description ---");
    console.log(result.rows[0].description);
    console.log("-----------------------------------------");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
