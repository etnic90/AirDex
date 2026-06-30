import fs from 'fs';
import readline from 'readline';

const logPath = 'C:/Users/Mirko/.gemini/antigravity-cli/brain/a8508a07-f6f2-4629-b9a7-bb8eba142172/.system_generated/logs/transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('Bristol') || line.includes('Freighter') || line.includes('ITA Airways')) {
      // Parse JSON to make it readable and output key info
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'PLANNER_RESPONSE' || obj.type === 'USER_INPUT') {
          console.log(`Line ${lineCount} (${obj.type}):`);
          const text = obj.content || '';
          // Print snippet around the keyword
          const idx = text.toLowerCase().indexOf('freighter');
          if (idx !== -1) {
            console.log(text.substring(Math.max(0, idx - 100), Math.min(text.length, idx + 200)));
            console.log('---');
          }
          const idx2 = text.toLowerCase().indexOf('ita airways');
          if (idx2 !== -1) {
            console.log(text.substring(Math.max(0, idx2 - 100), Math.min(text.length, idx2 + 200)));
            console.log('---');
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

main();
