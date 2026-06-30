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
    const tables = ['aircraft_models', 'airlines', 'airports'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\nTable [${table}] columns:`);
      result.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }
  } catch (err) {
    console.error("Failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
