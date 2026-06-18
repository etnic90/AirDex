import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// User agent conforme alle linee guida di Wikipedia per prevenire rate-limiting (429)
const HEADERS = {
  "User-Agent": "AviationPokedexLogoSync/1.0 (https://github.com/aviation-pokedex; contact@aviation-pokedex.org)",
  "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
};

// Funzione helper per cercare il logo su Wikipedia/Wikidata (P154) in caso di fallimento di Clearbit/CORS
async function searchWikipediaLogo(airlineName) {
  try {
    const queries = [airlineName, `${airlineName} (airline)`, `${airlineName} airline`].map(q => q.trim());
    
    for (const query of queries) {
      console.log(`  ├─ 🔍 Ricerca fallback Wikipedia/Wikidata per: "${query}"...`);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
      const searchRes = await fetch(searchUrl, { headers: HEADERS });
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const searchResults = searchData.query?.search || [];
      
      for (const result of searchResults) {
        const pageTitle = result.title;
        
        // Verifica che il titolo del risultato contenga almeno una parola chiave significativa del nome della compagnia,
        // per evitare falsi positivi (es. "Spirit Airlines" abbinato per errore a "United Airlines").
        const nameWords = airlineName.toLowerCase().replace(/[()]/g, '').split(/\s+/).filter(w => w !== 'airlines' && w !== 'airways' && w !== 'lines' && w !== 'air');
        const titleLower = pageTitle.toLowerCase();
        
        if (nameWords.length > 0 && !nameWords.some(word => titleLower.includes(word))) {
          console.log(`  ├─ ⚠️ Salto risultato non pertinente: "${pageTitle}"`);
          continue;
        }
        
        // Recupera il QID di Wikidata associato alla pagina
        const propsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
        const propsRes = await fetch(propsUrl, { headers: HEADERS });
        if (!propsRes.ok) continue;
        const propsData = await propsRes.json();
        
        const pages = propsData.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        const qid = pages[pageId]?.pageprops?.wikibase_item;
        
        if (!qid) continue;
        
        // Tentativo 1: Recupera la proprietà P154 (logo image) da Wikidata
        const claimsUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P154&format=json&origin=*`;
        const claimsRes = await fetch(claimsUrl, { headers: HEADERS });
        let filename = null;
        
        if (claimsRes.ok) {
          const claimsData = await claimsRes.json();
          const p154Claims = claimsData.claims?.P154 || [];
          if (p154Claims.length > 0) {
            filename = p154Claims[0]?.mainsnak?.datavalue?.value;
          }
        }
        
        // Tentativo 2: Se Wikidata non ha P154 (es. United Airlines), interroghiamo le immagini incorporate nell'articolo Wikipedia!
        if (!filename) {
          console.log(`  ├─ 💡 Nessun logo P154 su Wikidata per "${pageTitle}". Ricerca file nell'articolo Wikipedia...`);
          const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=100&format=json&origin=*`;
          const imagesRes = await fetch(imagesUrl, { headers: HEADERS });
          if (imagesRes.ok) {
            const imagesData = await imagesRes.json();
            const imgPages = imagesData.query?.pages || {};
            const imgPageId = Object.keys(imgPages)[0];
            const pageImages = imgPages[imgPageId]?.images || [];
            
            // Filtra l'immagine del logo escludendo i loghi e simboli di sistema di Wikipedia
            const excludeWords = ['wikidata', 'commons', 'wikivoyage', 'wikipedia', 'wiktionary', 'wikisource', 'wikibooks', 'wikiquote', 'wikinews', 'wikispecies', 'meta-wiki'];
            const logoImage = pageImages.find(img => {
              const imgNameLower = img.title.toLowerCase();
              return (imgNameLower.includes('logo') || imgNameLower.includes('brand') || imgNameLower.includes('logo-')) &&
                     !excludeWords.some(word => imgNameLower.includes(word)) &&
                     nameWords.some(word => imgNameLower.includes(word));
            });
            
            if (logoImage) {
              filename = logoImage.title.replace(/^File:/i, '');
              console.log(`  ├─ 🎯 Trovato file logo nell'articolo: "${filename}"`);
            }
          }
        }
        
        if (!filename) continue;
        
        // Recupera l'URL diretto dal server Wikipedia/Commons (usando en.wikipedia per supportare anche i file locali under fair-use)
        const commonsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
        const commonsRes = await fetch(commonsUrl, { headers: HEADERS });
        if (!commonsRes.ok) continue;
        const commonsData = await commonsRes.json();
        
        const commonsPages = commonsData.query?.pages || {};
        const commonsPageId = Object.keys(commonsPages)[0];
        const logoUrl = commonsPages[commonsPageId]?.imageinfo?.[0]?.url;
        
        if (logoUrl) {
          console.log(`  ├─ 🎯 Trovato logo ufficiale: ${logoUrl.substring(0, 60)}...`);
          return logoUrl;
        }
      }
    }
  } catch (e) {
    console.error(`  ├─ ⚠️ Errore durante la ricerca Wikipedia/Wikidata:`, e.message);
  }
  return null;
}

async function runLogoSync() {
  console.log("==========================================================");
  console.log("🚀 AVVIO MANUTENZIONE LOGHI LOCALE (Terminale Reale + Wikipedia Fallback)");
  console.log("==========================================================");

  // 1. Recupera tutte le compagnie aeree (con paginazione per bypassare il limite di 1000)
  console.log("🔍 Lettura compagnie dal database (con paginazione)...");
  let airlines = [];
  let start = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('airlines')
      .select('id, name, website, logo_url')
      .range(start, start + size - 1);

    if (error) {
      console.error("❌ Errore Supabase nel recupero dati:", error.message);
      return;
    }
    airlines = airlines.concat(data || []);
    if (!data || data.length < size) {
      break;
    }
    start += size;
  }

  const force = process.argv.includes('--force');
  const targets = (airlines || []).filter(airline => {
    if (force) return true;
    const logo = airline.logo_url;
    return !logo || !logo.includes("supabase.co");
  });

  console.log(`📊 Trovate ${targets.length} compagnie da aggiornare (su ${airlines.length} totali).`);

  if (targets.length === 0) {
    console.log("✅ Tutti i loghi sono già localizzati su Supabase!");
    return;
  }

  let successes = 0;

  for (let i = 0; i < targets.length; i++) {
    const airline = targets[i];
    const currentIndex = i + 1;
    
    console.log(`\n🔍 [${currentIndex}/${targets.length}] Elaborazione: ${airline.name}...`);

    let targetUrl = null;
    let wikiUrl = null;
    let useWikiFallback = false;

    // Se c'è già un logo ed è wikipedia, proviamo prima quello
    if (airline.logo_url && airline.logo_url.trim() !== "" && !airline.logo_url.includes("supabase.co")) {
      targetUrl = airline.logo_url;
      console.log(`  ├─ 🌐 Logo corrente: ${targetUrl}`);
    } 
    // Altrimenti proviamo a generare Clearbit
    else if (airline.website) {
      let domain = airline.website
        .replace(/https?:\/\//, '')
        .replace(/www\./, '')
        .split('/')[0];
      targetUrl = `https://logo.clearbit.com/${domain}`;
      console.log(`  ├─ 🌐 Generato URL Clearbit: ${targetUrl}`);
    }

    let downloadSuccess = false;
    let buffer = null;
    let contentType = "image/png";

    // Primo tentativo: URL target
    if (targetUrl) {
      try {
        console.log(`  ├─ 📥 Scaricamento da URL target...`);
        const res = await fetch(targetUrl, { headers: HEADERS });
        if (res.ok) {
          contentType = res.headers.get("content-type") || "image/png";
          buffer = await res.arrayBuffer();
          downloadSuccess = true;
        } else {
          console.log(`  ├─ ⚠️ URL target ha risposto con status: ${res.status}`);
          useWikiFallback = true;
        }
      } catch (err) {
        console.log(`  ├─ ⚠️ Errore scaricamento URL target: ${err.message}`);
        // Se l'errore è DNS (ENOTFOUND), attiviamo il fallback Wikipedia
        if (err.message.includes("fetch failed") || (err.cause && err.cause.code === "ENOTFOUND")) {
          useWikiFallback = true;
        }
      }
    } else {
      useWikiFallback = true;
    }

    // Secondo tentativo: Fallback Wikipedia
    if (useWikiFallback) {
      wikiUrl = await searchWikipediaLogo(airline.name);
      if (wikiUrl) {
        try {
          console.log(`  ├─ 📥 Scaricamento da Wikipedia...`);
          const res = await fetch(wikiUrl, { headers: HEADERS });
          if (res.ok) {
            contentType = res.headers.get("content-type") || "image/png";
            buffer = await res.arrayBuffer();
            downloadSuccess = true;
          } else {
            console.log(`  ├─ ⚠️ Wikipedia ha risposto con status: ${res.status}`);
          }
        } catch (err) {
          console.log(`  ├─ ❌ Errore scaricamento da Wikipedia: ${err.message}`);
        }
      }
    }

    // Se il download è riuscito, effettuiamo l'upload e aggiorniamo il DB
    if (downloadSuccess && buffer) {
      try {
        // Determina l'estensione appropriata dall'URL sorgente (molto più affidabile rispetto a contentType HTTP)
        let ext = "png";
        const sourceUrl = useWikiFallback ? wikiUrl : targetUrl;
        if (sourceUrl) {
          try {
            const pathLower = new URL(sourceUrl).pathname.toLowerCase();
            if (pathLower.endsWith('.svg')) ext = "svg";
            else if (pathLower.endsWith('.webp')) ext = "webp";
            else if (pathLower.endsWith('.jpg') || pathLower.endsWith('.jpeg')) ext = "jpg";
            else if (pathLower.endsWith('.png')) ext = "png";
          } catch (_) {}
        }

        // Forza il contentType corretto per l'upload su Supabase
        let uploadContentType = "image/png";
        if (ext === "svg") uploadContentType = "image/svg+xml";
        else if (ext === "webp") uploadContentType = "image/webp";
        else if (ext === "jpg") uploadContentType = "image/jpeg";

        // Aggiungiamo un timestamp univoco al nome file per evitare violazioni RLS di sovrascrittura (UPDATE)
        const storagePath = `airlines/${airline.id}_${Date.now()}.${ext}`;
        console.log(`  ├─ ☁️ Upload su Supabase (Bucket: spotters, Path: ${storagePath}, Mime: ${uploadContentType})...`);

        // Carichiamo sul bucket 'spotters'
        const { error: uploadError } = await supabase.storage
          .from('spotters')
          .upload(storagePath, buffer, {
            upsert: true,
            contentType: uploadContentType
          });

        if (uploadError) {
          throw new Error(`Errore di caricamento Storage: ${uploadError.message}`);
        }

        // Ottieni l'URL pubblico
        const { data: { publicUrl } } = supabase.storage
          .from('spotters')
          .getPublicUrl(storagePath);

        // Aggiorna il database
        const { error: dbError } = await supabase
          .from('airlines')
          .update({ logo_url: publicUrl })
          .eq('id', airline.id);

        if (dbError) {
          throw new Error(`Errore di aggiornamento Database: ${dbError.message}`);
        }

        console.log(`✅ [SUCCESSO] Logo localizzato per: ${airline.name}`);
        successes++;

      } catch (err) {
        console.error(`❌ [ERRORE AGGIORNAMENTO] ${airline.name}: ${err.message}`);
      }
    } else {
      console.log(`❌ [DEFINITIVO] Impossibile trovare o scaricare il logo per: ${airline.name}`);
    }

    // Pausa di 1.5 secondi per prevenire rate-limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\n==========================================================");
  console.log(`🏁 SEED COMPLETATO! Loghi salvati localmente: ${successes}/${targets.length}`);
  console.log("==========================================================");
}

runLogoSync();
