import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Columns in airports:", Object.keys(data[0] || {}));
    console.log("Full sample record:", data[0]);
  }
}

inspect();
