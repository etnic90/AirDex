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
  
  const row = res.rows[0];
  const desc = row.description_it || row.description;
  
  // Let's split by lines and search for '#' character
  const lines = desc.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('#')) {
      console.log(`Line ${idx + 1}: ${JSON.stringify(line)}`);
    }
  });
  
  await client.end();
}
main();
