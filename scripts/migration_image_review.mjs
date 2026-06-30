import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function addReviewColumn(tableName) {
  const checkCol = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name=$1 AND column_name='image_needs_review' AND table_schema='public'
  `, [tableName]);

  if (checkCol.rows.length === 0) {
    console.log(`Adding column image_needs_review to public.${tableName}...`);
    await client.query(`
      ALTER TABLE public.${tableName}
      ADD COLUMN image_needs_review BOOLEAN DEFAULT false NOT NULL
    `);
    console.log(`Column added successfully to public.${tableName}!`);
  } else {
    console.log(`Column image_needs_review already exists in public.${tableName}.`);
  }
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres database!");

    await addReviewColumn('aircraft_models');
    await addReviewColumn('airports');
    await addReviewColumn('airlines');

    console.log("Image review columns migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
