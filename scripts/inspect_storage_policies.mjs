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
    console.log("Connected to database!");
    const res = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'objects' OR schemaname = 'storage'
    `);
    
    console.log("Storage policies:");
    res.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
