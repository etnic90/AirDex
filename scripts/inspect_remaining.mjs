import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const { data: airlines } = await supabase
    .from('airlines')
    .select('name, history')
    .ilike('name', '%Aeroitalia%')
    .limit(1);

  console.log("Aeroitalia history in DB:");
  console.log(airlines[0]?.history);
}

inspect();
