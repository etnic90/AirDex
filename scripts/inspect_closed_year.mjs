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
    SELECT 
      COUNT(*) as total,
      COUNT(closed_year) as non_null_closed_year,
      SUM(CASE WHEN closed_year IS NULL THEN 1 ELSE 0 END) as null_closed_year,
      SUM(CASE WHEN closed_year = 0 THEN 1 ELSE 0 END) as zero_closed_year
    FROM airlines
  `);
  console.log(res.rows[0]);
  
  const sample = await client.query(`
    SELECT name, closed_year FROM airlines LIMIT 10
  `);
  console.log("Sample:", sample.rows);
  
  await client.end();
}
main();
