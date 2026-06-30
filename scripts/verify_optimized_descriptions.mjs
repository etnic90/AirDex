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
      console.log(`\n========================================\nModel: ${model_name}\n========================================`);
      console.log(description_it.slice(0, 450) + "...\n");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
