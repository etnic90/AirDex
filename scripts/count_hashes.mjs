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
    SELECT description, description_it
    FROM aircraft_models
    WHERE id = 'bafb9690-28f8-4531-b2a5-55dc853d4a7a'
  `);
  
  const desc = res.rows[0].description_it || res.rows[0].description;
  
  // Find index of every '#' character in the description string
  let idx = desc.indexOf('#');
  while (idx !== -1) {
    const start = Math.max(0, idx - 15);
    const end = Math.min(desc.length, idx + 25);
    console.log(`Hash at index ${idx}: ${JSON.stringify(desc.substring(start, end))}`);
    idx = desc.indexOf('#', idx + 1);
  }
  
  await client.end();
}
main();
