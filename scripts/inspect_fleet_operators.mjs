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
    const targetModels = [
      { id: '369087de-4293-4900-8854-1be0c7f91e9e', name: 'Boeing 707-120' },
      { id: '49f5d486-4b1e-45b3-8c3b-204854fcf4d2', name: 'Boeing 747-100' },
      { id: '34c339ff-1f32-4abc-8f2e-317eb281408d', name: 'Concorde' },
      { id: '47eef079-9f32-4d16-ba6e-7cbbcb753b9d', name: 'DC-3' },
      { id: '2ab0adc5-35b4-4de1-866a-43e22b1023d1', name: 'Airbus A300B4' }
    ];
    
    for (const model of targetModels) {
      const result = await client.query(`
        SELECT f.qty, f.status, a.name as airline_name, a.country
        FROM public.airline_fleet f
        JOIN public.airlines a ON a.id = f.airline_id
        WHERE f.aircraft_model_id = $1;
      `, [model.id]);
      
      console.log(`\nOperators for "${model.name}" (${model.id}):`);
      if (result.rows.length === 0) {
        console.log("- NO OPERATORS FOUND");
      } else {
        result.rows.forEach(row => {
          console.log(`- Airline: "${row.airline_name}" | Country: "${row.country}" | Qty: ${row.qty} | Status: ${row.status}`);
        });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
