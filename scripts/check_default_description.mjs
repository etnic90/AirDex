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
      SELECT description, description_it 
      FROM public.aircraft_models 
      WHERE id = '47eef079-9f32-4d16-ba6e-7cbbcb753b9d';
    `);
    
    console.log("description (default):");
    console.log(result.rows[0].description ? result.rows[0].description.slice(0, 300) : 'null');
    console.log("\ndescription_it:");
    console.log(result.rows[0].description_it ? result.rows[0].description_it.slice(0, 300) : 'null');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
