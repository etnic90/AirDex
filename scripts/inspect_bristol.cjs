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
    SELECT id, model_name, manufacturer_id, status, first_flight_year
    FROM aircraft_models
    WHERE model_name ILIKE '%Britannia%' OR model_name ILIKE '%britania%'
  `);
  console.log("Britannia rows:", res.rows);
  await client.end();
}
main();
