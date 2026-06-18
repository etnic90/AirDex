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
    const res = await client.query("SELECT id, email, created_at FROM auth.users");
    console.log("Users in auth.users:", res.rows);
  } catch (err) {
    console.error("Failed to query users:", err.message);
  } finally {
    await client.end();
  }
}

main();
