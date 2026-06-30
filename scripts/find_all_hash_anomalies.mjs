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
      FROM public.aircraft_models 
      WHERE description_it LIKE '%#%';
    `);
    
    console.log(`Found ${result.rows.length} aircraft models with '#' in description_it:`);
    
    result.rows.forEach(row => {
      const lines = row.description_it.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('#')) {
          // A valid heading should start with ### or #### followed by a space
          const isValidHeading = /^###\s+/.test(line) || /^####\s+/.test(line);
          if (!isValidHeading) {
            console.log(`- Model: "${row.model_name}" (ID: ${row.id}) | Line ${index + 1}: "${line}" [ANOMALY]`);
          }
        }
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
