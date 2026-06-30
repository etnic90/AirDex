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
      SELECT DISTINCT a.name, a.country 
      FROM public.airlines a 
      JOIN public.airline_fleet f ON a.id = f.airline_id
      WHERE f.status = 'HISTORIC' OR f.status = 'ACTIVE';
    `);
    console.log("Airlines in fleet and their countries:");
    result.rows.forEach(row => {
      console.log(`- Airline: "${row.name}", Country: "${row.country}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
