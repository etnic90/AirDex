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
    console.log("Connected to DB");

    console.log("Dropping existing constraint user_captures_status_check...");
    await client.query(`
      ALTER TABLE public.user_captures 
      DROP CONSTRAINT IF EXISTS user_captures_status_check;
    `);

    console.log("Adding new constraint user_captures_status_check supporting FAVORITE...");
    await client.query(`
      ALTER TABLE public.user_captures 
      ADD CONSTRAINT user_captures_status_check 
      CHECK (status = ANY (ARRAY['SPOTTED'::text, 'FLOWN'::text, 'FAVORITE'::text]));
    `);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

main();
