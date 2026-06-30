import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const prompt = `Fornisci un elenco accurato e storicamente completo di compagnie aeree (vettori) reali che operano o hanno operato il modello di aereo: "Bristol 170 Freighter".
Includi sia vettori attuali (ACTIVE) che storici/dismessi (HISTORIC), con una stima realistica del numero massimo di esemplari avuti in flotta (qty).

Rispondi esclusivamente in formato JSON come un array di oggetti, senza blocchi di codice markdown, senza spiegazioni, con la seguente struttura:
[
  {
    "airline_name": "Nome Compagnia (es. Lufthansa, American Airlines, Alitalia)",
    "iata_code": "IATA (2 lettere, es. LH, AA, AZ)",
    "status": "ACTIVE" o "HISTORIC",
    "qty": 15
  }
]
Usa Google Search per verificare le informazioni reali degli utilizzatori storici e attivi (ad esempio da Wikipedia) ed evita assolutamente di allucinare compagnie che non hanno mai operato questo modello.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log("Raw Response:");
    console.log(response.text);
    console.log("\nGrounding Metadata:");
    console.log(JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2));
  } catch (e) {
    console.error(e);
  }
}

main();
