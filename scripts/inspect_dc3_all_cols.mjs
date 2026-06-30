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
      SELECT description, description_en, description_it, description_es, description_fr
      FROM public.aircraft_models
      WHERE id = '47eef079-9f32-4d16-ba6e-7cbbcb753b9d';
    `);
    
    const row = result.rows[0];
    for (const col of Object.keys(row)) {
      console.log(`\n--- COLUMN: ${col} ---`);
      if (row[col]) {
        const lines = row[col].split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('#') || line.trim() === '#') {
            console.log(`${idx + 1}: ${JSON.stringify(line)}`);
          }
        });
      } else {
        console.log("(null/empty)");
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
