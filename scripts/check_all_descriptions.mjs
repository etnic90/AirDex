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
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'aircraft_models' AND column_name LIKE 'description%';
    `);
    
    const cols = result.rows.map(r => r.column_name);
    console.log("Description columns in aircraft_models:", cols);

    const dataResult = await client.query(`
      SELECT ${cols.join(', ')} 
      FROM public.aircraft_models 
      WHERE id = '47eef079-9f32-4d16-ba6e-7cbbcb753b9d';
    `);

    console.log("\nData for each description column:");
    cols.forEach(col => {
      console.log(`\n--- ${col} ---`);
      console.log(dataResult.rows[0][col] ? dataResult.rows[0][col].slice(0, 300) : 'null');
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
