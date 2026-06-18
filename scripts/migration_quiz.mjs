import pg from 'pg';

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
    console.log("Connected successfully to pooler!");
    
    // Check if column is_pro already exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='user_profiles' AND column_name='is_pro'
    `);
    
    if (checkRes.rows.length === 0) {
      console.log("Adding is_pro column to user_profiles...");
      await client.query(`
        ALTER TABLE public.user_profiles 
        ADD COLUMN is_pro BOOLEAN DEFAULT false NOT NULL
      `);
      console.log("Column is_pro added successfully!");
    } else {
      console.log("Column is_pro already exists in user_profiles.");
    }
  } catch (err) {
    console.error("Migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
