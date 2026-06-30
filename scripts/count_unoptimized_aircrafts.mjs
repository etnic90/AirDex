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
      SELECT id, model_name, description_it
      FROM public.aircraft_models;
    `);

    let unoptimized = 0;
    let optimized = 0;

    result.rows.forEach(row => {
      const desc = row.description_it;
      if (desc && desc.includes('### Architettura & Design Tecnologico')) {
        optimized++;
      } else {
        unoptimized++;
      }
    });

    console.log(`Total aircraft models: ${result.rows.length}`);
    console.log(`Optimized (Gold Standard): ${optimized}`);
    console.log(`Unoptimized: ${unoptimized}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
