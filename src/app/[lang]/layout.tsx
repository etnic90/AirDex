import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

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
    <html lang={lang} className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-800/30">
        <NextIntlClientProvider messages={messages} locale={lang}>
          <div className="fixed inset-0 -z-10 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 to-transparent opacity-50" />
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