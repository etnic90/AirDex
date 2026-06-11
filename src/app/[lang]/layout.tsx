import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "../../components/Navbar";

// Configurazione Font: Inter per testi eleganti, JetBrains per dati tecnici
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
  const resolvedParams = await params;

  return (
    <html lang={resolvedParams.lang} className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-800/30">
        {/* Sfondo Profondo con sfumature radiali */}
        <div className="fixed inset-0 -z-10 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 to-transparent opacity-50" />
        </div>

        <Navbar lang={resolvedParams.lang} />
        
        <div className="flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}