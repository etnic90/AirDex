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
      SELECT description_it
      FROM public.aircraft_models
      WHERE id = '47eef079-9f32-4d16-ba6e-7cbbcb753b9d';
    `);
    
    const desc = result.rows[0].description_it;
    const index = desc.indexOf("Specifiche");
    if (index !== -1) {
      const sliceStart = Math.max(0, index - 250);
      const sliceEnd = Math.min(desc.length, index + 100);
      const slice = desc.slice(sliceStart, sliceEnd);
      console.log("--- RAW STRING SLICE ---");
      console.log(JSON.stringify(slice));
      console.log("------------------------");
    } else {
      console.log("Not found 'Specifiche'");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
