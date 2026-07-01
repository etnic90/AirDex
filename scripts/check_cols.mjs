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
  
  const resAirlines = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'airlines'
  `);
  console.log("airlines columns:", resAirlines.rows.map(r => `${r.column_name} (${r.data_type})`));

  const resAirports = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'airports'
  `);
  console.log("airports columns:", resAirports.rows.map(r => `${r.column_name} (${r.data_type})`));
  
  await client.end();
}
main();
