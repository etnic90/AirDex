import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const WIKI_HEADERS = {
    "User-Agent": "AviationPokedexBot/3.0-Persistent (Local Development; contact: admin@localhost)"
};

// --- PARAMETRI DI MISSIONE ---
const BATCH_SIZE = 250; // Quanti aerei elaborare in un colpo solo
const MAX_TRIES = 15;   // Quante volte insistere sullo stesso aereo in caso di singhiozzo di Wiki

async function runImageFetch() {
  console.log(`📸 Avvio radar fotografico (Ricerca: max ${BATCH_SIZE} bersagli | Insistenza: ${MAX_TRIES} tentativi)...`);

  // Preleviamo i null o i vecchi NOT_FOUND_WIKI
  const { data: aircrafts, error } = await supabase
    .from('aircraft_models')
    .select('id, model_name, manufacturers(name)')
    .or('house_livery_url.is.null,house_livery_url.eq.NOT_FOUND_WIKI')
    .limit(BATCH_SIZE);

  if (error) {
    console.error("❌ Errore Supabase:", error.message);
    return;
  }

  if (!aircrafts || aircrafts.length === 0) {
    console.log("✅ Flotta fotograficamente completa o nessun aereo da scansionare.");
    return;
  }

  let successCount = 0;
  const totalAircrafts = aircrafts.length;

  for (let i = 0; i < totalAircrafts; i++) {
    const aircraft = aircrafts[i];
    const currentIndex = i + 1; // Contatore umano (parte da 1)
    
    const fullName = `${aircraft.manufacturers?.name || ''} ${aircraft.model_name}`.trim();
    
    // TELEMETRIA AGGIORNATA
    console.log(`\n🔍 [${currentIndex}/${totalAircrafts}] Scansione per: ${fullName}...`);

    let imageUrl = null;

    const getWikiImageNative = async (query) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
        const res = await fetch(url, { headers: WIKI_HEADERS });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.query?.pages) {
            const pageId = Object.keys(data.query.pages)[0];
            const pageData = data.query.pages[pageId];
            return pageData.original?.source || pageData.thumbnail?.source || null;
        }
        return null;
    };

    // Loop di insistenza sullo stesso aereo
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        if (attempt > 1) {
            process.stdout.write(`  ├─ [Singhiozzo Wiki] Riprovo... Tentativo ${attempt}/${MAX_TRIES}\r`);
        }

        try {
            imageUrl = await getWikiImageNative(fullName);
            
            if (!imageUrl) {
                imageUrl = await getWikiImageNative(`${aircraft.model_name} aircraft`);
            }

            if (imageUrl) {
                break; // Uscita anticipata se troviamo la foto
            }
        } catch (e) {
            // Ignoriamo gli errori di rete temporanei e continuiamo il loop
        }

        // Aspetta 1 secondo tra i tentativi sullo stesso aereo
        await new Promise(r => setTimeout(r, 1000));
    }

    // Se abbiamo trovato l'URL da Wikipedia, proviamo a scaricarlo e caricarlo su Supabase Storage
    let finalImageUrl = null;
    if (imageUrl) {
        try {
            console.log(`  ├─ 🌐 Trovato URL Wiki: ${imageUrl.substring(0, 60)}...`);
            console.log(`  ├─ 📥 Download dell'immagine da Wikipedia...`);
            const imgRes = await fetch(imageUrl, { headers: WIKI_HEADERS });
            if (imgRes.ok) {
                const contentType = imgRes.headers.get("content-type") || "image/jpeg";
                const buffer = await imgRes.arrayBuffer();
                
                let ext = "jpg";
                if (contentType.includes("png")) ext = "png";
                else if (contentType.includes("webp")) ext = "webp";
                else if (contentType.includes("svg")) ext = "svg";
                
                const storagePath = `liveries/${aircraft.id}-wiki.${ext}`;
                console.log(`  ├─ ☁️ Upload su Supabase Storage (${storagePath})...`);
                
                const { error: uploadError } = await supabase.storage
                    .from('aircraft_images')
                    .upload(storagePath, buffer, {
                        upsert: true,
                        contentType: contentType
                    });
                    
                if (uploadError) {
                    throw uploadError;
                }
                
                const { data: { publicUrl } } = supabase.storage
                    .from('aircraft_images')
                    .getPublicUrl(storagePath);
                
                finalImageUrl = publicUrl;
                console.log(`  ├─ ☁️ Upload completato con successo.`);
            } else {
                console.log(`  ├─ ⚠️ Impossibile scaricare l'immagine (Status: ${imgRes.status}). Uso URL Wikipedia.`);
                finalImageUrl = imageUrl;
            }
        } catch (err) {
            console.error(`  ├─ ❌ Errore scaricamento/caricamento (Storage):`, err.message);
            finalImageUrl = imageUrl; // Fallback all'URL diretto di Wikipedia
        }
    }

    // Salvataggio finale sul Database
    await supabase
        .from('aircraft_models')
        .update({ house_livery_url: finalImageUrl || 'NOT_FOUND_WIKI' })
        .eq('id', aircraft.id);

    // Pulizia visiva se ci sono stati ritentativi sulla stessa riga
    if (finalImageUrl) {
        console.log(`✅ [CATTURATO] Immagine salvata per: ${aircraft.model_name}`);
        successCount++;
    } else {
        console.log(`❌ [DEFINITIVO] Nessun asset dopo ${MAX_TRIES} tentativi per ${aircraft.model_name}.`);
    }

    // Pausa di 2 secondi tra un aereo e l'altro
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n🏁 Blocco completato. Immagini portate a casa: ${successCount} su ${totalAircrafts}`);
}

runImageFetch();