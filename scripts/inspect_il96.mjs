import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT id, name FROM manufacturers WHERE name ILIKE '%Ilyushin%' OR name ILIKE '%Iliushin%'
  `);
  console.log("Manufacturers:", res.rows);
  await client.end();
}
main();
