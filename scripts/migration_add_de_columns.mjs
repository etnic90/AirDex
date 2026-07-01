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
  
  console.log("Adding description_de to aircraft_models...");
  try {
    await client.query(`
      ALTER TABLE aircraft_models 
      ADD COLUMN IF NOT EXISTS description_de text;
    `);
    console.log("Successfully added description_de!");
  } catch (e) {
    console.error("Error adding description_de:", e.message);
  }

  console.log("Adding history_de to airlines...");
  try {
    await client.query(`
      ALTER TABLE airlines 
      ADD COLUMN IF NOT EXISTS history_de text;
    `);
    console.log("Successfully added history_de to airlines!");
  } catch (e) {
    console.error("Error adding history_de to airlines:", e.message);
  }

  console.log("Adding history_de to airports...");
  try {
    await client.query(`
      ALTER TABLE airports 
      ADD COLUMN IF NOT EXISTS history_de text;
    `);
    console.log("Successfully added history_de to airports!");
  } catch (e) {
    console.error("Error adding history_de to airports:", e.message);
  }

  await client.end();
}
main();
