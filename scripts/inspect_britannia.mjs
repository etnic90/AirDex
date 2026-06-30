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
    SELECT id, model_name, manufacturer_id, status, first_flight_year, description, description_it
    FROM aircraft_models
    WHERE model_name ILIKE '%Britannia%' OR model_name ILIKE '%britania%'
  `);
  console.log("Britannia:", res.rows);
  
  if (res.rows.length > 0 && res.rows[0].manufacturer_id) {
    const manRes = await client.query(`
      SELECT id, name FROM manufacturers WHERE id = $1
    `, [res.rows[0].manufacturer_id]);
    console.log("Manufacturer:", manRes.rows[0]);
  } else {
    console.log("No manufacturer_id or no rows found.");
  }
  
  await client.end();
}
main();
