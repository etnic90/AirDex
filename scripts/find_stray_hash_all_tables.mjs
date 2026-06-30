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

    // 1. Scan airlines
    const airlinesRes = await client.query(`
      SELECT id, name, history, history_it, history_en, history_es, history_fr
      FROM public.airlines;
    `);
    console.log(`Scanning ${airlinesRes.rows.length} airlines...`);
    airlinesRes.rows.forEach(row => {
      ['history', 'history_it', 'history_en', 'history_es', 'history_fr'].forEach(col => {
        const text = row[col];
        if (!text) return;
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('#')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('#') || (!trimmed.startsWith('### ') && !trimmed.startsWith('#### '))) {
              console.log(`[STRAY HASH FOUND in airlines] Name: "${row.name}" | Column: ${col} | Line ${idx + 1}: "${line}"`);
            }
          }
        });
      });
    });

    // 2. Scan airports
    const airportsRes = await client.query(`
      SELECT id, name, history, history_it, history_en, history_es, history_fr, runway_details
      FROM public.airports;
    `);
    console.log(`Scanning ${airportsRes.rows.length} airports...`);
    airportsRes.rows.forEach(row => {
      ['history', 'history_it', 'history_en', 'history_es', 'history_fr', 'runway_details'].forEach(col => {
        const text = row[col];
        if (!text) return;
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('#')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('#') || (!trimmed.startsWith('### ') && !trimmed.startsWith('#### '))) {
              console.log(`[STRAY HASH FOUND in airports] Name: "${row.name}" | Column: ${col} | Line ${idx + 1}: "${line}"`);
            }
          }
        });
      });
    });

    console.log("All scans completed.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
