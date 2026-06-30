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
    SELECT *
    FROM aircraft_models
    WHERE id = 'bafb9690-28f8-4531-b2a5-55dc853d4a7a'
  `);
  
  const row = res.rows[0];
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === 'string' && (val.includes('#') || val.length > 50)) {
      console.log(`--- Column: ${key} ---`);
      console.log(val);
    }
  }
  await client.end();
}
main();
