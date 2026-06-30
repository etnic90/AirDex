import fs from 'fs';
import path from 'path';

const envLocal = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    process.env[parts[0].trim()] = parts[1].trim();
  }
});

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log("Fetching chunks without sorting in DB...");
  const [chunk1, chunk2, chunk3, chunk4] = await Promise.all([
    client.from("airlines").select("*").range(0, 999),
    client.from("airlines").select("*").range(1000, 1999),
    client.from("airlines").select("*").range(2000, 2999),
    client.from("airlines").select("*").range(3000, 3999),
  ]);
  
  console.log("Chunk 1 size:", chunk1.data?.length, "Error:", chunk1.error);
  console.log("Chunk 2 size:", chunk2.data?.length, "Error:", chunk2.error);
  console.log("Chunk 3 size:", chunk3.data?.length, "Error:", chunk3.error);
  console.log("Chunk 4 size:", chunk4.data?.length, "Error:", chunk4.error);
}
main();
