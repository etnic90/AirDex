import pg from 'pg';

const client = new pg.Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT id, name, iata_code, icao_code, history 
      FROM public.airports 
      WHERE history IS NOT NULL AND history != '' 
      LIMIT 10
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

main();
