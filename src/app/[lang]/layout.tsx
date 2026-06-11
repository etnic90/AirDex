import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "../../components/Navbar"; // Importiamo il nostro HUD

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AirDex - Aviation Pokedex",
  description: "Colleziona e scopri gli aerei del mondo",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  // Aspettiamo di sapere la lingua corrente
  const resolvedParams = await params;

  return (
    <html lang={resolvedParams.lang}>
      <body className={`${inter.className} bg-slate-900 text-slate-200 min-h-screen flex flex-col selection:bg-cyan-500/30`}>
        {/* Inseriamo la Navbar in alto per tutto il sito */}
        <Navbar lang={resolvedParams.lang} />
        
        {/* Qui dentro Next.js inietterà le singole pagine (Homepage, Profilo, Login) */}
        <div className="flex-grow">
          {children}
        </div>
      </body>
    </html>
  );
}