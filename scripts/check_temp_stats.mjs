import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const nullCount = await client.query(`SELECT COUNT(*) FROM public.airports WHERE history IS NULL`);
    const shortCount = await client.query(`SELECT COUNT(*) FROM public.airports WHERE history IS NOT NULL AND LENGTH(history) < 200`);
    const defaultTextCount = await client.query(`SELECT COUNT(*) FROM public.airports WHERE history LIKE '%Importante scalo aereo%'`);
    const totalCount = await client.query(`SELECT COUNT(*) FROM public.airports`);
    
    console.log(`- Null: ${nullCount.rows[0].count}`);
    console.log(`- Short: ${shortCount.rows[0].count}`);
    console.log(`- Default text: ${defaultTextCount.rows[0].count}`);
    console.log(`- Total: ${totalCount.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
