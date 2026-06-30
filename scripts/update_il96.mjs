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
  console.log("Updating Il-96-400M manufacturer...");
  const res = await client.query(`
    UPDATE aircraft_models
    SET manufacturer_id = '046ca4d7-a008-4ed4-8154-ba684ab7ed80'
    WHERE id = 'bafb9690-28f8-4531-b2a5-55dc853d4a7a'
  `);
  console.log("Updated rows:", res.rowCount);
  await client.end();
}
main();
