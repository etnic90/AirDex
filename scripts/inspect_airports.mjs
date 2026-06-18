import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='airports'
    `);
    console.log("Columns of airports:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    const sample = await client.query(`SELECT * FROM airports LIMIT 1`);
    console.log("Sample row:", sample.rows[0]);
  } catch (err) {
    console.error("Failed to query airports schema:", err.message);
  } finally {
    await client.end();
  }
}

main();
