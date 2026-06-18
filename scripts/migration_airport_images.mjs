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
    console.log("Connected successfully to database pooler!");
    
    // Check and add image_url
    const checkImage = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='airports' AND column_name='image_url'
    `);
    
    if (checkImage.rows.length === 0) {
      console.log("Adding image_url column to airports...");
      await client.query(`
        ALTER TABLE public.airports 
        ADD COLUMN image_url TEXT DEFAULT NULL
      `);
      console.log("Column image_url added successfully!");
    } else {
      console.log("Column image_url already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
