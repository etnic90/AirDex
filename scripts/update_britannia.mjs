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
  console.log("Updating Britannia 300 manufacturer to Bristol...");
  const res = await client.query(`
    UPDATE aircraft_models
    SET manufacturer_id = '279d16a4-959d-4215-81c5-450431addc4b'
    WHERE id = '2bbbe49a-7411-4cf1-820b-f59a8d8c3775'
  `);
  console.log("Updated rows:", res.rowCount);
  await client.end();
}
main();
