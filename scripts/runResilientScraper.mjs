import { spawn } from 'child_process';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const { Client } = pg;
const connectionString = "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

async function getRemainingFleetsCount() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const totalRes = await client.query('SELECT COUNT(*) FROM public.aircraft_models');
    const totalModels = parseInt(totalRes.rows[0].count, 10);
    
    const progressPath = resolve(__dirname, '../scratch/mass_fleet_progress.json');
    if (fs.existsSync(progressPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        if (saved.processedAircraftIds) {
          const processedCount = saved.processedAircraftIds.length;
          return Math.max(0, totalModels - processedCount);
        }
      } catch (e) {
        console.warn("⚠️ Watchdog: Error parsing mass_fleet_progress.json:", e.message);
      }
    }
    return totalModels;
  } catch (err) {
    console.error("⚠️ Watchdog: Error connecting to database for fleets count:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function getRemainingAirportsCount() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT COUNT(*) FROM public.airports
      WHERE history IS NULL OR LENGTH(history) < 200 OR history LIKE '%Importante scalo aereo%'
    `);
    return parseInt(res.rows[0].count, 10);
  } catch (err) {
    console.error("⚠️ Watchdog: Error connecting to database for airports count:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function getRemainingAirlinesCount() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT COUNT(*) FROM public.airlines
      WHERE history IS NULL OR LENGTH(history) < 200
    `);
    return parseInt(res.rows[0].count, 10);
  } catch (err) {
    console.error("⚠️ Watchdog: Error connecting to database for airlines count:", err.message);
    return null;
  } finally {
    await client.end();
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function runSubprocess(scriptName) {
  return new Promise((done) => {
    const scriptPath = resolve(__dirname, scriptName);
    console.log(`🚀 Watchdog: Starting subprocess: node ${scriptPath}`);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      console.log(`ℹ️ Watchdog: Subprocess node ${scriptName} exited with code ${code}`);
      done(code);
    });

    child.on('error', (err) => {
      console.error(`❌ Watchdog: Failed to start node ${scriptName}:`, err.message);
      done(-1);
    });
  });
}

async function main() {
  console.log("🛡️ AirDex Resilient Pipeline Watchdog Active.");

  // STAGE 1: AIRPORTS
  console.log("\n🛫 --- STAGE 1: AIRPORTS HISTORY ENRICHMENT ---");
  while (true) {
    const remaining = await getRemainingAirportsCount();
    if (remaining === null) {
      console.log("🕒 Watchdog: Retrying database connection in 30 seconds...");
      await sleep(30000);
      continue;
    }

    if (remaining === 0) {
      console.log("🎉 Stage 1 Complete! All airports are enriched.");
      break;
    }

    console.log(`📊 Watchdog Status: ${remaining} airports still need enrichment.`);
    const code = await runSubprocess('enrichAirportsProgrammatic.mjs');
    if (code === 0) {
      console.log("🎉 Stage 1 completed (sweep finished successfully). Proceeding to Stage 2.");
      break;
    }

    const newRemaining = await getRemainingAirportsCount();
    if (newRemaining > 0) {
      console.log(`⏳ Watchdog: Airport scraper exited with code ${code}, but ${newRemaining} airports remain. Restarting in 30 seconds...`);
      await sleep(30000);
    } else {
      console.log("🎉 Stage 1 Complete! All airports are enriched.");
      break;
    }
  }

  // STAGE 2: AIRLINES
  console.log("\n✈️ --- STAGE 2: AIRLINES HISTORY ENRICHMENT ---");
  while (true) {
    const remaining = await getRemainingAirlinesCount();
    if (remaining === null) {
      console.log("🕒 Watchdog: Retrying database connection in 30 seconds...");
      await sleep(30000);
      continue;
    }

    if (remaining === 0) {
      console.log("🎉 Stage 2 Complete! All airlines are enriched.");
      break;
    }

    console.log(`📊 Watchdog Status: ${remaining} airlines still need enrichment.`);
    const code = await runSubprocess('enrichAirlinesProgrammatic.mjs');
    if (code === 0) {
      console.log("🎉 Stage 2 completed (sweep finished successfully). Proceeding to Stage 3.");
      break;
    }

    const newRemaining = await getRemainingAirlinesCount();
    if (newRemaining > 0) {
      console.log(`⏳ Watchdog: Airline scraper exited with code ${code}, but ${newRemaining} airlines remain. Restarting in 30 seconds...`);
      await sleep(30000);
    } else {
      console.log("🎉 Stage 2 Complete! All airlines are enriched.");
      break;
    }
  }

  // STAGE 3: FLEETS ASSOCIATION
  console.log("\n🛸 --- STAGE 3: AIRCRAFT FLEETS ASSOCIATION ---");
  while (true) {
    const remaining = await getRemainingFleetsCount();
    if (remaining === null) {
      console.log("🕒 Watchdog: Retrying database connection in 30 seconds...");
      await sleep(30000);
      continue;
    }

    if (remaining === 0) {
      console.log("🎉 Stage 3 Complete! All fleets are associated.");
      break;
    }

    console.log(`📊 Watchdog Status: ${remaining} aircraft models still need fleet association.`);
    const code = await runSubprocess('enrichAircraftFleetsProgrammatic.mjs');
    if (code === 0) {
      console.log("🎉 Stage 3 completed (sweep finished successfully). Proceeding to Stage 4.");
      break;
    }

    const newRemaining = await getRemainingFleetsCount();
    if (newRemaining > 0) {
      console.log(`⏳ Watchdog: Fleet scraper exited with code ${code}, but ${newRemaining} aircraft models remain. Restarting in 30 seconds...`);
      await sleep(30000);
    } else {
      console.log("🎉 Stage 3 Complete! All fleets are associated.");
      break;
    }
  }

  // STAGE 4: AIRLINE LOGO LOCALIZATION
  console.log("\n🖼️ --- STAGE 4: AIRLINE LOGO LOCALIZATION ---");
  await runSubprocess('localLogoSync.mjs');

  // STAGE 5: AIRCRAFT LIVERY LOCALIZATION
  console.log("\n✈️ --- STAGE 5: AIRCRAFT LIVERY LOCALIZATION ---");
  await runSubprocess('localAircraftImageSync.mjs');

  console.log("\n🏆 --- PIPELINE COMPLETE: ALL STAGES OF AIR DEX ENRICHMENT COMPLETED SUCCESSFULLY! ---");
}

main();
