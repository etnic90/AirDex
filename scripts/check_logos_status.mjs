import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkLogos() {
  console.log("Checking airlines logo URLs...");
  const { data, error } = await supabase
    .from('airlines')
    .select('id, name, logo_url');

  if (error) {
    console.error("Error fetching airlines:", error.message);
    return;
  }

  console.log(`Total airlines: ${data.length}`);
  const externalLogos = data.filter(a => a.logo_url && !a.logo_url.includes('supabase.co'));
  const supabaseLogos = data.filter(a => a.logo_url && a.logo_url.includes('supabase.co'));
  const noLogos = data.filter(a => !a.logo_url);

  console.log(`- Supabase local logos: ${supabaseLogos.length}`);
  console.log(`- External logos: ${externalLogos.length}`);
  console.log(`- No logos: ${noLogos.length}`);

  if (externalLogos.length > 0) {
    console.log("\nSome external logos:");
    externalLogos.slice(0, 5).forEach(a => {
      console.log(`  * ${a.name}: ${a.logo_url}`);
    });
  }
}

checkLogos();
