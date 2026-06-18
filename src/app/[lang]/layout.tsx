import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import Navbar from "@/components/Navbar";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });

export const metadata: Metadata = {
  title: "AirDex - Aviation Hangar",
  description: "Colleziona e scopri gli aerei del mondo",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

// Caricamento sicuro: se la lingua è errata, usiamo un oggetto vuoto
  // per evitare il blocco del rendering radice
  let messages;
  try {
    messages = await getMessages({ locale: lang });
  } catch (error) {
    console.error("Errore caricamento messaggi:", error);
    messages = {}; 
  }

return (
    <html lang={lang} className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-800/30">
        <NextIntlClientProvider messages={messages} locale={lang}>
          <div className="fixed inset-0 -z-10 bg-slate-950 overflow-hidden">
            {/* Mesh gradient di sfondo olografico */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />
            <div className="absolute top-[30%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />
            
            {/* Griglia olografica sottile */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_40%,transparent_100%)] opacity-20" />
          </div>

          <Navbar lang={lang} />
          
          <div className="flex-grow">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}