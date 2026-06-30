import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    const result = await client.query(`
      SELECT id, model_name, description_it, description_en, description
      FROM public.aircraft_models;
    `);

    console.log(`Scanning ${result.rows.length} aircraft models for any '#' symbol...`);

    result.rows.forEach(row => {
      ['description_it', 'description_en', 'description'].forEach(field => {
        const content = row[field];
        if (!content) return;
        
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('#')) {
            // Print everything containing '#' so we can inspect it
            console.log(`- Model: "${row.model_name}" | Col: ${field} | Line ${index + 1}: "${line}"`);
          }
        });
      });
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
