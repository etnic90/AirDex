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

const targetModelIds = [
  '9b8c852b-5aba-4641-989d-7a67a8cdad92', // Lockheed L-1011-100
  '369087de-4293-4900-8854-1be0c7f91e9e', // Boeing 707-120
  '49f5d486-4b1e-45b3-8c3b-204854fcf4d2', // Boeing 747-100
  '34c339ff-1f32-4abc-8f2e-317eb281408d', // Concorde
  '47eef079-9f32-4d16-ba6e-7cbbcb753b9d', // Douglas DC-3
  '2ab0adc5-35b4-4de1-866a-43e22b1023d1'  // Airbus A300B4
];

async function main() {
  try {
    await client.connect();
    for (const id of targetModelIds) {
      const selectRes = await client.query(`
        SELECT model_name, description_it 
        FROM public.aircraft_models 
        WHERE id = $1;
      `, [id]);
      
      const { model_name, description_it } = selectRes.rows[0];
      if (!description_it) continue;

      console.log(`\nChecking model: "${model_name}"`);
      let idx = description_it.indexOf('#');
      while (idx !== -1) {
        const start = Math.max(0, idx - 15);
        const end = Math.min(description_it.length, idx + 25);
        const snippet = description_it.slice(start, end);
        console.log(`- Found '#' at index ${idx}: ${JSON.stringify(snippet)}`);
        idx = description_it.indexOf('#', idx + 1);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
