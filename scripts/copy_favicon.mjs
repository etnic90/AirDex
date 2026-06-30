import fs from 'fs';
import path from 'path';

const src = "C:/Users/Mirko/.gemini/antigravity-cli/brain/a8508a07-f6f2-4629-b9a7-bb8eba142172/airdex_favicon_1782832843692.jpg";
const dest = "C:/wamp64/www/aviation-pokedex/src/app/icon.jpg";

try {
  fs.copyFileSync(src, dest);
  console.log("Successfully copied favicon to src/app/icon.jpg");
  
  // Delete favicon.ico if it exists, to avoid conflicts
  const oldFavicon = "C:/wamp64/www/aviation-pokedex/src/app/favicon.ico";
  if (fs.existsSync(oldFavicon)) {
    fs.unlinkSync(oldFavicon);
    console.log("Removed old favicon.ico");
  }
} catch (e) {
  console.error("Error copying favicon:", e);
}
