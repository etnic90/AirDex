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
      SELECT id, model_name, description, description_it, description_en
      FROM public.aircraft_models;
    `);

    console.log(`Searching all ${result.rows.length} models for exactly '#' or stray '#' in text fields...`);

    result.rows.forEach(row => {
      ['description', 'description_it', 'description_en'].forEach(col => {
        const text = row[col];
        if (!text) return;

        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed === '#' || trimmed === '##' || trimmed === '###' || trimmed === '####') {
            console.log(`[FOUND EXACT HASH LINE] Model: "${row.model_name}" (ID: ${row.id}) | Col: ${col} | Line ${idx + 1}: "${line}"`);
          }
          if (line.includes('#') && !trimmed.startsWith('### ') && !trimmed.startsWith('#### ')) {
            console.log(`[FOUND STRAY HASH IN LINE] Model: "${row.model_name}" (ID: ${row.id}) | Col: ${col} | Line ${idx + 1}: "${line}"`);
          }
        });
      });
    });

    console.log("Search completed.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
