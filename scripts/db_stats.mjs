import pg from 'pg';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Airports count
    const totalAirportsRes = await client.query('SELECT COUNT(*) FROM public.airports');
    const totalAirports = parseInt(totalAirportsRes.rows[0].count, 10);
    
    const remainingAirportsRes = await client.query(`
      SELECT COUNT(*) FROM public.airports
      WHERE history IS NULL OR LENGTH(history) < 200 OR history LIKE '%Importante scalo aereo%'
    `);
    const remainingAirports = parseInt(remainingAirportsRes.rows[0].count, 10);

    // Airlines count
    const totalAirlinesRes = await client.query('SELECT COUNT(*) FROM public.airlines');
    const totalAirlines = parseInt(totalAirlinesRes.rows[0].count, 10);

    const remainingAirlinesRes = await client.query(`
      SELECT COUNT(*) FROM public.airlines
      WHERE history IS NULL OR LENGTH(history) < 200
    `);
    const remainingAirlines = parseInt(remainingAirlinesRes.rows[0].count, 10);

    // Aircraft models count
    const totalModelsRes = await client.query('SELECT COUNT(*) FROM public.aircraft_models');
    const totalModels = parseInt(totalModelsRes.rows[0].count, 10);

    // Fleets progress
    let processedFleets = 0;
    const progressPath = resolve(__dirname, '../scratch/mass_fleet_progress.json');
    if (fs.existsSync(progressPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        if (saved.processedAircraftIds) {
          processedFleets = saved.processedAircraftIds.length;
        }
      } catch (e) {
        // ignore
      }
    }

    // Logo & Livery localizations
    const localLogosRes = await client.query(`
      SELECT COUNT(*) FROM public.airlines 
      WHERE logo_url IS NOT NULL AND logo_url LIKE '%/storage/v1/object/public/spotters/airlines/%'
    `);
    const localLogos = parseInt(localLogosRes.rows[0].count, 10);

    const localLiveriesRes = await client.query(`
      SELECT COUNT(*) FROM public.aircraft_models 
      WHERE house_livery_url IS NOT NULL AND house_livery_url LIKE '%/storage/v1/object/public/aircraft_images/liveries/%'
    `);
    const localLiveries = parseInt(localLiveriesRes.rows[0].count, 10);

    console.log("==========================================");
    console.log("📊 DATABASE & PIPELINE PROGRESS REPORT");
    console.log("==========================================");
    console.log(`🛫 STAGE 1: AIRPORTS HISTORY`);
    console.log(`   - Total Airports: ${totalAirports}`);
    console.log(`   - Enriched Airports: ${totalAirports - remainingAirports}`);
    console.log(`   - Remaining Airports: ${remainingAirports}`);
    console.log(`   - Stage 1 Progress: ${((totalAirports - remainingAirports) / totalAirports * 100).toFixed(2)}%`);
    console.log("------------------------------------------");
    console.log(`✈️ STAGE 2: AIRLINES HISTORY`);
    console.log(`   - Total Airlines: ${totalAirlines}`);
    console.log(`   - Enriched Airlines: ${totalAirlines - remainingAirlines}`);
    console.log(`   - Remaining Airlines: ${remainingAirlines}`);
    console.log(`   - Stage 2 Progress: ${((totalAirlines - remainingAirlines) / totalAirlines * 100).toFixed(2)}%`);
    console.log("------------------------------------------");
    console.log(`🛸 STAGE 3: FLEET ASSOCIATION`);
    console.log(`   - Total Aircraft Models: ${totalModels}`);
    console.log(`   - Associated Models: ${processedFleets}`);
    console.log(`   - Remaining Models: ${Math.max(0, totalModels - processedFleets)}`);
    console.log(`   - Stage 3 Progress: ${(processedFleets / totalModels * 100).toFixed(2)}%`);
    console.log("------------------------------------------");
    console.log(`🖼️ STAGE 4: AIRLINE LOGO SYNC`);
    console.log(`   - Localized Logos: ${localLogos}`);
    console.log(`   - Stage 4 Progress: ${(localLogos / totalAirlines * 100).toFixed(2)}%`);
    console.log("------------------------------------------");
    console.log(`✈️ STAGE 5: AIRCRAFT LIVERY SYNC`);
    console.log(`   - Localized Liveries: ${localLiveries}`);
    console.log(`   - Stage 5 Progress: ${(localLiveries / totalModels * 100).toFixed(2)}%`);
    console.log("==========================================");

  } catch (err) {
    console.error("❌ Stats error:", err.message);
  } finally {
    await client.end();
  }
}

main();
