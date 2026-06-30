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
  console.log("Updating Curtiss Eagle livery URL to correct airplane image...");
  
  const res = await client.query(`
    UPDATE aircraft_models 
    SET house_livery_url = 'https://upload.wikimedia.org/wikipedia/commons/4/40/Curtiss_Eagle_I.jpg',
        image_needs_review = false
    WHERE id = '70899b40-fad9-4526-8f3b-d9e2349103a0'
  `);
  
  console.log("Update completed. Rows affected:", res.rowCount);
  await client.end();
}
main();
