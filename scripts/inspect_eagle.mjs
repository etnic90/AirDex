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
    SELECT am.id, am.model_name, m.name as manufacturer_name, am.house_livery_url
    FROM aircraft_models am
    JOIN manufacturers m ON am.manufacturer_id = m.id
    WHERE am.model_name ILIKE '%Eagle%'
  `);
  console.log(res.rows);
  await client.end();
}
main();
