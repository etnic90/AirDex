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
      SELECT id, model_name, description_it, description_en, description 
      FROM public.aircraft_models;
    `);

    console.log(`Scanning ${result.rows.length} models for inline/stray '#' characters...`);

    result.rows.forEach(row => {
      ['description_it', 'description_en', 'description'].forEach(col => {
        const text = row[col];
        if (!text) return;

        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('#')) {
            // Check if the '#' is not at the very beginning of the line
            const trimmed = line.trim();
            if (!trimmed.startsWith('#')) {
              console.log(`[STRAY HASH FOUND] Model: "${row.model_name}" | Column: ${col} | Line ${idx + 1}: "${line}"`);
            } else {
              // It starts with '#'. Check if it's a valid heading
              const isHeading = /^###\s+/.test(trimmed) || /^####\s+/.test(trimmed);
              if (!isHeading) {
                console.log(`[INVALID HEADING HASH FOUND] Model: "${row.model_name}" | Column: ${col} | Line ${idx + 1}: "${line}"`);
              }
            }
          }
        });
      });
    });

    console.log("Scan completed.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
