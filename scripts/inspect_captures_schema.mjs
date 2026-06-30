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
    
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_captures' AND table_schema = 'public'
    `);
    console.log("Columns in user_captures:");
    columns.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    
    // Check constraints or enum type
    const constraints = await client.query(`
      SELECT 
        cc.constraint_name, 
        cc.check_clause
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE 
        tc.table_name = 'user_captures' AND tc.table_schema = 'public'
    `);
    console.log("\nConstraints on user_captures:");
    constraints.rows.forEach(r => console.log(`- Name: ${r.constraint_name}, Clause: ${r.check_clause}`));
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
