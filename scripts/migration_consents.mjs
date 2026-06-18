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
    console.log("Connected successfully to database pooler!");
    
    // Check and add privacy_accepted
    const checkPrivacy = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='user_profiles' AND column_name='privacy_accepted'
    `);
    
    if (checkPrivacy.rows.length === 0) {
      console.log("Adding privacy_accepted column to user_profiles...");
      await client.query(`
        ALTER TABLE public.user_profiles 
        ADD COLUMN privacy_accepted BOOLEAN DEFAULT false NOT NULL
      `);
      console.log("Column privacy_accepted added successfully!");
    } else {
      console.log("Column privacy_accepted already exists.");
    }

    // Check and add newsletter_subscribed
    const checkNewsletter = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='user_profiles' AND column_name='newsletter_subscribed'
    `);
    
    if (checkNewsletter.rows.length === 0) {
      console.log("Adding newsletter_subscribed column to user_profiles...");
      await client.query(`
        ALTER TABLE public.user_profiles 
        ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false NOT NULL
      `);
      console.log("Column newsletter_subscribed added successfully!");
    } else {
      console.log("Column newsletter_subscribed already exists.");
    }
  } catch (err) {
    console.error("Migration failed:", err.stack);
  } finally {
    await client.end();
  }
}

main();
