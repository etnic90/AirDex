import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const LOG_FILE = resolve(__dirname, 'image_sync_progress.log');

// Setup clean log file
fs.writeFileSync(LOG_FILE, `--- AIRCRAFT IMAGE LOCALIZATION SYNC LOG START --- \nStarted at: ${new Date().toISOString()}\n\n`);

function log(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const HEADERS = {
  "User-Agent": "AviationPokedexImageSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
};

function sanitizeFileName(name) {
  if (!name) return 'unknown';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]/g, "-")      // Replace non-alphanumeric characters with hyphen
    .replace(/-+/g, "-")             // Collapse multiple hyphens
    .replace(/^-|-$/g, "");          // Trim hyphens from start and end
}

async function downloadImage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      log(`  ├─ ⚠️ Download fallito per ${url}. Status code: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return { buffer, contentType };
  } catch (err) {
    log(`  ├─ ❌ Errore scaricamento da ${url}: ${err.message}`);
    return null;
  }
}

async function runImageSync() {
  log("🚀 Inizio localizzazione delle immagini in evidenza per gli Aerei...");

  // Setup Postgres connection to configure RLS policy dynamically
  const dbClient = new pg.Client({
    connectionString: "postgresql://postgres.acowoegaamsjhykzwzyh:Yx%25Acx3%26%2Bi4ezU%2C@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  let rlsEnabled = false;

  try {
    await dbClient.connect();
    log("🔓 Creazione policy temporanea RLS per caricamenti pubblici su aircraft_images...");
    await dbClient.query(`DROP POLICY IF EXISTS "Temp Public Aircraft Images Policy" ON storage.objects`);
    await dbClient.query(`
      CREATE POLICY "Temp Public Aircraft Images Policy" ON storage.objects
      FOR ALL TO public
      USING (bucket_id = 'aircraft_images')
      WITH CHECK (bucket_id = 'aircraft_images')
    `);
    rlsEnabled = true;
    log("✅ Policy temporanea RLS attivata.");
  } catch (dbErr) {
    log(`⚠️ Impossibile configurare RLS temporanea: ${dbErr.message}`);
  }

  try {
    // 1. Recupera tutti i velivoli con i dati del produttore
    log("🔍 Lettura modelli aereo dal database...");
    let aircrafts = [];
    let start = 0;
    const size = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('aircraft_models')
        .select('id, model_name, house_livery_url, launch_customer_livery_url, manufacturers(name)')
        .range(start, start + size - 1);

      if (error) {
        log(`❌ Errore Supabase nel recupero aerei: ${error.message}`);
        return;
      }
      aircrafts = aircrafts.concat(data || []);
      if (!data || data.length < size) {
        break;
      }
      start += size;
    }

    log(`📊 Totale modelli aereo letti dal DB: ${aircrafts.length}`);

    // Filtra quelli con immagini esterne
    const targets = aircrafts.filter(a => {
      const hasExternalHouse = a.house_livery_url && a.house_livery_url.startsWith('http') && !a.house_livery_url.includes('supabase.co');
      const hasExternalLaunch = a.launch_customer_livery_url && a.launch_customer_livery_url.startsWith('http') && !a.launch_customer_livery_url.includes('supabase.co');
      return hasExternalHouse || hasExternalLaunch;
    });

    log(`🎯 Trovati ${targets.length} aerei con immagini esterne da localizzare.`);

    if (targets.length === 0) {
      log("✅ Tutte le immagini degli aerei sono già localizzate o non hanno immagini esterne!");
      return;
    }

    let totalUploaded = 0;
    let aircraftsProcessed = 0;

    for (let i = 0; i < targets.length; i++) {
      const aircraft = targets[i];
      aircraftsProcessed++;
      const manufacturerName = aircraft.manufacturers?.name || 'Aviation';
      
      log(`\n📦 [${aircraftsProcessed}/${targets.length}] Modello: ${manufacturerName} - ${aircraft.model_name}`);

      const safeManufacturer = sanitizeFileName(manufacturerName);
      const safeModel = sanitizeFileName(aircraft.model_name);

      let dbUpdates = {};

      // A) Gestione House Livery (Standard)
      if (aircraft.house_livery_url && aircraft.house_livery_url.startsWith('http') && !aircraft.house_livery_url.includes('supabase.co')) {
        log(`  ├─ 🏠 Scaricamento house livery da: ${aircraft.house_livery_url}`);
        const downloadResult = await downloadImage(aircraft.house_livery_url);
        
        if (downloadResult) {
          let ext = 'jpg';
          if (downloadResult.contentType.includes('png')) ext = 'png';
          else if (downloadResult.contentType.includes('webp')) ext = 'webp';
          else if (downloadResult.contentType.includes('svg')) ext = 'svg';

          const fileName = `${safeManufacturer}-${safeModel}-house.${ext}`;
          const storagePath = `liveries/${fileName}`;

          log(`  ├─ 📤 Uploading house livery a Supabase Storage: ${storagePath}`);
          const { error: uploadError } = await supabase.storage
            .from('aircraft_images')
            .upload(storagePath, downloadResult.buffer, {
              upsert: true,
              contentType: downloadResult.contentType
            });

          if (uploadError) {
            log(`  ├─ ❌ Errore upload Storage: ${uploadError.message}`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('aircraft_images')
              .getPublicUrl(storagePath);
            
            dbUpdates.house_livery_url = publicUrl;
            totalUploaded++;
            log(`  ├─ ✅ Upload completato! URL: ${publicUrl}`);
          }
        }
        await new Promise(r => setTimeout(r, 1500)); // Attesa precauzionale per Wikipedia
      }

      // B) Gestione Launch Customer Livery
      if (aircraft.launch_customer_livery_url && aircraft.launch_customer_livery_url.startsWith('http') && !aircraft.launch_customer_livery_url.includes('supabase.co')) {
        log(`  ├─ 🚀 Scaricamento launch livery da: ${aircraft.launch_customer_livery_url}`);
        const downloadResult = await downloadImage(aircraft.launch_customer_livery_url);
        
        if (downloadResult) {
          let ext = 'jpg';
          if (downloadResult.contentType.includes('png')) ext = 'png';
          else if (downloadResult.contentType.includes('webp')) ext = 'webp';
          else if (downloadResult.contentType.includes('svg')) ext = 'svg';

          const fileName = `${safeManufacturer}-${safeModel}-launch.${ext}`;
          const storagePath = `liveries/${fileName}`;

          log(`  ├─ 📤 Uploading launch livery a Supabase Storage: ${storagePath}`);
          const { error: uploadError } = await supabase.storage
            .from('aircraft_images')
            .upload(storagePath, downloadResult.buffer, {
              upsert: true,
              contentType: downloadResult.contentType
            });

          if (uploadError) {
            log(`  ├─ ❌ Errore upload Storage: ${uploadError.message}`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('aircraft_images')
              .getPublicUrl(storagePath);
            
            dbUpdates.launch_customer_livery_url = publicUrl;
            totalUploaded++;
            log(`  ├─ ✅ Upload completato! URL: ${publicUrl}`);
          }
        }
        await new Promise(r => setTimeout(r, 1500));
      }

      // C) Aggiornamento Database se ci sono modifiche
      if (Object.keys(dbUpdates).length > 0) {
        log(`  ├─ 💾 Aggiornamento DB per ID: ${aircraft.id}`);
        const { error: dbError } = await supabase
          .from('aircraft_models')
          .update(dbUpdates)
          .eq('id', aircraft.id);

        if (dbError) {
          log(`  ├─ ❌ Errore aggiornamento DB: ${dbError.message}`);
        } else {
          log(`  ├─ 🎉 Aggiornato con successo nel database!`);
        }
      }

      // Pausa finale tra velivoli
      await new Promise(r => setTimeout(r, 1500));
    }

    log(`\n==========================================================`);
    log(`🏁 LOCALIZZAZIONE COMPLETATA!`);
    log(`Aerei elaborati: ${aircraftsProcessed}/${targets.length}`);
    log(`Immagini caricate con successo nel Bucket: ${totalUploaded}`);
    log(`==========================================================`);

  } catch (err) {
    log(`❌ Errore irreversibile nel processo: ${err.message}`);
  } finally {
    if (rlsEnabled) {
      try {
        log("🔒 Rimozione policy temporanea RLS...");
        await dbClient.query(`DROP POLICY IF EXISTS "Temp Public Aircraft Images Policy" ON storage.objects`);
        log("✅ RLS ripristinata correttamente.");
      } catch (cleanErr) {
        log(`⚠️ Errore durante il ripristino delle RLS: ${cleanErr.message}`);
      }
    }
    await dbClient.end();
  }
}

runImageSync();
