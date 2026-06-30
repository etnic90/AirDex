import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PALETTE = [
  '#2563EB', '#1E40AF', '#0D9488', '#0F766E', 
  '#4F46E5', '#3730A3', '#0891B2', '#0E7490', 
  '#0284C7', '#0369A1', '#7C3AED', '#6D28D9'
];

function generateSVG(name, code) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgColor = PALETTE[hash % PALETTE.length];
  
  // Clean up name for display: truncate if too long
  let displayName = name;
  if (displayName.length > 18) {
    displayName = displayName.substring(0, 15) + '...';
  }
  
  // Escape XML chars
  const escapedName = displayName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
    
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="100%" height="100%" rx="24" fill="${bgColor}"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">${code || '??'}</text>
      <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.9)" font-weight="500">${escapedName}</text>
    </svg>
  `.trim();
}

async function run() {
  console.log("==========================================");
  console.log("🚀 STARTING LOGO FALLBACK GENERATION FOR 100% COVERAGE");
  console.log("==========================================");

  // 1. Fetch all airlines
  console.log("🔍 Fetching airlines from database...");
  let airlines = [];
  let start = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('airlines')
      .select('id, name, logo_url, iata_code, icao_code')
      .range(start, start + size - 1);

    if (error) {
      console.error("❌ Supabase fetch error:", error.message);
      return;
    }
    airlines = airlines.concat(data || []);
    if (!data || data.length < size) {
      break;
    }
    start += size;
  }

  // 2. Filter targets (no supabase logo)
  const targets = airlines.filter(a => !a.logo_url || !a.logo_url.includes("supabase.co"));
  console.log(`📊 Found ${targets.length} airlines without localized logos out of ${airlines.length} total.`);

  if (targets.length === 0) {
    console.log("✅ All logos are already localized!");
    return;
  }

  let count = 0;
  for (let i = 0; i < targets.length; i++) {
    const al = targets[i];
    const code = al.iata_code || al.icao_code || al.name.substring(0, 2).toUpperCase();
    const svg = generateSVG(al.name, code);
    const buffer = Buffer.from(svg, 'utf-8');
    const storagePath = `airlines/fallback_${al.id}.svg`;

    console.log(`[${i + 1}/${targets.length}] Uploading fallback logo for ${al.name} (${code})...`);

    // Upload to supabase spotters bucket
    const { error: uploadError } = await supabase.storage
      .from('spotters')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: 'image/svg+xml'
      });

    if (uploadError) {
      console.error(`  ❌ Storage upload failed: ${uploadError.message}`);
      continue;
    }

    // Get public Url
    const { data: { publicUrl } } = supabase.storage
      .from('spotters')
      .getPublicUrl(storagePath);

    // Update DB
    const { error: dbError } = await supabase
      .from('airlines')
      .update({ logo_url: publicUrl })
      .eq('id', al.id);

    if (dbError) {
      console.error(`  ❌ Database update failed: ${dbError.message}`);
      continue;
    }

    count++;
    // Sleep a tiny bit to prevent rate limit
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n✅ Fallback logo synchronization completed! Successfully updated ${count} logos.`);
  console.log("==========================================");
}

run().catch(e => console.error("Fatal logo fallback error:", e));
