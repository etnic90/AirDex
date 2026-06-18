import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const WIKI_HEADERS = {
  "User-Agent": "AviationPokedexBot/3.0 (https://github.com/google/aviation-pokedex; mirko.user@example.com) next-intl/3.0"
};

async function getWikiImage(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) {
      if (res.status === 429) {
        console.log("⚠️ Ricevuto 429 da Wikipedia. Pausa prolungata di 5 secondi...");
        await new Promise(r => setTimeout(r, 5000));
      }
      return null;
    }
    const data = await res.json();
    if (data.query?.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      const pageData = data.query.pages[pageId];
      return pageData.original?.source || pageData.thumbnail?.source || null;
    }
  } catch (error) {
    // console.error(`Error searching Wikipedia for ${query}:`, error);
  }
  return null;
}

async function run() {
  console.log("📸 Avvio importazione immagini aeroporti sequenziale...");

  // Leggiamo gli aeroporti senza immagine
  const { data: airports, error } = await supabase
    .from('airports')
    .select('id, name, city, country, iata_code, icao_code')
    .or('image_url.is.null,image_url.eq.NOT_FOUND')
    .order('iata_code', { ascending: true });

  if (error) {
    console.error("Errore lettura aeroporti:", error);
    return;
  }

  console.log(`Trovati ${airports.length} aeroporti da elaborare.`);

  if (airports.length === 0) {
    console.log("Nessun aeroporto da aggiornare.");
    return;
  }

  for (let i = 0; i < airports.length; i++) {
    const airport = airports[i];
    let imageUrl = null;
    
    // Tentativo 1: Nome completo dell'aeroporto
    imageUrl = await getWikiImage(airport.name);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay tra tentativi

    // Tentativo 2: IATA + " airport"
    if (!imageUrl && airport.iata_code) {
      imageUrl = await getWikiImage(`${airport.iata_code} airport`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Tentativo 3: Città + Nazione + " airport"
    if (!imageUrl) {
      imageUrl = await getWikiImage(`${airport.city} ${airport.country} airport`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const savedUrl = imageUrl || 'NOT_FOUND';
    
    const { error: updateError } = await supabase
      .from('airports')
      .update({ image_url: savedUrl })
      .eq('id', airport.id);

    if (updateError) {
      console.error(`Errore salvataggio per ${airport.name}:`, updateError);
    } else {
      console.log(`[${i + 1}/${airports.length}] [${airport.iata_code || '---'}] ${airport.name} -> ${imageUrl ? 'TROVATO' : 'NOT_FOUND'}`);
    }

    // Delay di sicurezza tra aeroporti
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  console.log("🏁 Importazione completata!");
}

run();
