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
    const names = [
      'Pan American%',
      'TWA%',
      'British Airways%',
      'Air France%',
      'Lufthansa%',
      'Delta Air Lines%',
      'American Airlines%',
      'Qantas%',
      'Saudia%',
      'Alitalia%',
      'Eastern Air Lines%',
      'Singapore Airlines%'
    ];
    
    console.log("Searching for airlines...");
    for (const name of names) {
      const result = await client.query(`
        SELECT id, name, country 
        FROM public.airlines 
        WHERE name ILIKE $1;
      `, [name]);
      
      result.rows.forEach(row => {
        console.log(`- Airline: "${row.name}" | Country: "${row.country}" | ID: ${row.id}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
