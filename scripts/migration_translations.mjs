import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function addColumns(tableName, columns) {
  for (const col of columns) {
    const checkCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name=$1 AND column_name=$2 AND table_schema='public'
    `, [tableName, col]);

    if (checkCol.rows.length === 0) {
      console.log(`Adding column ${col} to table ${tableName}...`);
      await client.query(`
        ALTER TABLE public.${tableName}
        ADD COLUMN ${col} TEXT
      `);
      console.log(`Column ${col} added successfully!`);
    } else {
      console.log(`Column ${col} in table ${tableName} already exists.`);
    }
  }
}

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres database!");

    // 1. Column translations for aircraft_models
    await addColumns('aircraft_models', [
      'description_it', 'description_en', 'description_es', 'description_fr'
    ]);

    // 2. Column translations for airlines
    await addColumns('airlines', [
      'history_it', 'history_en', 'history_es', 'history_fr'
    ]);

    // 3. Column translations for airports
    await addColumns('airports', [
      'history_it', 'history_en', 'history_es', 'history_fr'
    ]);

    console.log("Translation columns migration completed successfully!");
  } catch (err) {
    console.error("Translation column migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
