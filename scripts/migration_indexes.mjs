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
    console.log("Connected to Supabase Postgres pooler!");

    // 1. Index on public.airports (country)
    console.log("Checking index public.airports(country)...");
    const checkAirportsCountry = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname='public' AND tablename='airports' AND indexname='idx_airports_country'
    `);
    if (checkAirportsCountry.rows.length === 0) {
      console.log("Creating index idx_airports_country...");
      await client.query(`
        CREATE INDEX idx_airports_country ON public.airports USING btree (country)
      `);
      console.log("Index idx_airports_country created successfully!");
    } else {
      console.log("Index idx_airports_country already exists.");
    }

    // 2. Index on public.airlines (country)
    console.log("Checking index public.airlines(country)...");
    const checkAirlinesCountry = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname='public' AND tablename='airlines' AND indexname='idx_airlines_country'
    `);
    if (checkAirlinesCountry.rows.length === 0) {
      console.log("Creating index idx_airlines_country...");
      await client.query(`
        CREATE INDEX idx_airlines_country ON public.airlines USING btree (country)
      `);
      console.log("Index idx_airlines_country created successfully!");
    } else {
      console.log("Index idx_airlines_country already exists.");
    }

    // 3. Index on public.airlines (alliance)
    console.log("Checking index public.airlines(alliance)...");
    const checkAirlinesAlliance = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname='public' AND tablename='airlines' AND indexname='idx_airlines_alliance'
    `);
    if (checkAirlinesAlliance.rows.length === 0) {
      console.log("Creating index idx_airlines_alliance...");
      await client.query(`
        CREATE INDEX idx_airlines_alliance ON public.airlines USING btree (alliance)
      `);
      console.log("Index idx_airlines_alliance created successfully!");
    } else {
      console.log("Index idx_airlines_alliance already exists.");
    }

    // 4. Index on public.articles (published_at DESC)
    console.log("Checking index public.articles(published_at DESC)...");
    const checkArticlesPublished = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname='public' AND tablename='articles' AND indexname='idx_articles_published_at'
    `);
    if (checkArticlesPublished.rows.length === 0) {
      console.log("Creating index idx_articles_published_at...");
      await client.query(`
        CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC NULLS LAST)
      `);
      console.log("Index idx_articles_published_at created successfully!");
    } else {
      console.log("Index idx_articles_published_at already exists.");
    }

    console.log("Database indexing script completed successfully!");
  } catch (err) {
    console.error("Index migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
