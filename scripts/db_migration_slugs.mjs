import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

// Function to generate slug
function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // separate accents from characters
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens from start/end
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL Database.");

    // 1. Add slug columns if they don't exist
    console.log("Adding 'slug' columns to aircraft_models, airlines, and airports...");
    await client.query(`
      ALTER TABLE aircraft_models ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
      ALTER TABLE airlines ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
      ALTER TABLE airports ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
    `);
    console.log("Columns added successfully (or already existed).");

    // 2. Populate aircraft_models
    console.log("Processing aircraft_models...");
    const { rows: planes } = await client.query(`SELECT id, model_name FROM aircraft_models`);
    const planeSlugs = new Set();
    for (const plane of planes) {
      let baseSlug = generateSlug(plane.model_name) || 'aircraft';
      let slug = baseSlug;
      let counter = 1;
      while (planeSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      planeSlugs.add(slug);
      await client.query(`UPDATE aircraft_models SET slug = $1 WHERE id = $2`, [slug, plane.id]);
    }
    console.log(`Updated ${planes.length} aircraft models with unique slugs.`);

    // 3. Populate airlines
    console.log("Processing airlines...");
    const { rows: airlines } = await client.query(`SELECT id, name FROM airlines`);
    const airlineSlugs = new Set();
    for (const airline of airlines) {
      let baseSlug = generateSlug(airline.name) || 'airline';
      let slug = baseSlug;
      let counter = 1;
      while (airlineSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      airlineSlugs.add(slug);
      await client.query(`UPDATE airlines SET slug = $1 WHERE id = $2`, [slug, airline.id]);
    }
    console.log(`Updated ${airlines.length} airlines with unique slugs.`);

    // 4. Populate airports
    console.log("Processing airports...");
    const { rows: airports } = await client.query(`SELECT id, name FROM airports`);
    const airportSlugs = new Set();
    for (const airport of airports) {
      let baseSlug = generateSlug(airport.name) || 'airport';
      let slug = baseSlug;
      let counter = 1;
      while (airportSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      airportSlugs.add(slug);
      await client.query(`UPDATE airports SET slug = $1 WHERE id = $2`, [slug, airport.id]);
    }
    console.log(`Updated ${airports.length} airports with unique slugs.`);

    // 5. Create unique indexes on the slug columns
    console.log("Creating unique indexes on slug columns...");
    await client.query(`
      DROP INDEX IF EXISTS aircraft_models_slug_idx;
      DROP INDEX IF EXISTS airlines_slug_idx;
      DROP INDEX IF EXISTS airports_slug_idx;
      
      CREATE UNIQUE INDEX aircraft_models_slug_idx ON aircraft_models(slug);
      CREATE UNIQUE INDEX airlines_slug_idx ON airlines(slug);
      CREATE UNIQUE INDEX airports_slug_idx ON airports(slug);
    `);
    console.log("Unique indexes created successfully!");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

main();
