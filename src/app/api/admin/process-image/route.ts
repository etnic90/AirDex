import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const aircraftId = formData.get("aircraftId") as string | null;

    if (!file && !imageUrl) {
      return NextResponse.json(
        { error: "Inserisci un file o un URL dell'immagine valido" },
        { status: 400 }
      );
    }

    if (!aircraftId) {
      return NextResponse.json(
        { error: "ID dell'aeromobile mancante" },
        { status: 400 }
      );
    }

    const tempDir = os.tmpdir();
    let inputPath = "";

    // 1. Prepara l'immagine di input (salva file locale o usa URL)
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = file.type.split("/").pop() || "jpg";
      inputPath = path.join(tempDir, `input_${aircraftId}_${Date.now()}.${fileExt}`);
      await fs.writeFile(inputPath, buffer);
    } else if (imageUrl) {
      inputPath = imageUrl;
    }

    const outputPath = path.join(tempDir, `output_${aircraftId}_${Date.now()}.webp`);
    
    // Lo sfondo è il nostro template realistico salvato in public
    const bgTemplatePath = path.resolve("./public/images/aircraft_sky_template.jpg");
    const scriptPath = path.resolve("./scripts/composite_image.py");

    // 2. Esegui lo script Python di rimozione sfondo e compositing
    const command = `python "${scriptPath}" "${inputPath}" "${bgTemplatePath}" "${outputPath}"`;
    
    console.log(`Running image processing command: ${command}`);
    
    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Script error: ${error.message}`);
          console.error(`Script stderr: ${stderr}`);
          reject(new Error(stderr || error.message));
        } else {
          console.log(`Script output: ${stdout}`);
          resolve();
        }
      });
    });

    // 3. Leggi il WebP risultante ed esegui l'upload su Supabase Storage
    const outputBuffer = await fs.readFile(outputPath);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const storagePath = `liveries/${aircraftId}-${Date.now()}.webp`;

    console.log(`Uploading processed WebP to Supabase Storage: ${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from("aircraft_images")
      .upload(storagePath, outputBuffer, {
        upsert: true,
        contentType: "image/webp",
      });

    if (uploadError) {
      throw new Error(`Errore durante l'upload storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("aircraft_images")
      .getPublicUrl(storagePath);

    // Pulizia dei file temporanei locali
    if (file && inputPath) {
      fs.unlink(inputPath).catch(err => console.error("Temp file cleanup failed:", err));
    }
    fs.unlink(outputPath).catch(err => console.error("Temp file cleanup failed:", err));

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Errore sconosciuto durante l'elaborazione" },
      { status: 500 }
    );
  }
}
