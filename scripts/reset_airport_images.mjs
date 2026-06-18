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
    
    console.log("Resetting image_url column in airports...");
    const res = await client.query(`
      UPDATE public.airports 
      SET image_url = NULL
    `);
    console.log(`Reset completed! Affected rows: ${res.rowCount}`);
  } catch (err) {
    console.error("Reset failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
