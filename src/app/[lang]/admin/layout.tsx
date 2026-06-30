import AdminGuard from "@/components/AdminGuard";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <AdminGuard lang={lang}>
      <div className="min-h-screen bg-slate-950 flex w-full">
        <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 hidden md:block flex-shrink-0">
          <h2 className="text-amber-500 font-black text-xl mb-8 tracking-tighter">AIRDEX ADMIN</h2>
          <nav className="space-y-4">
            <a href={`/${lang}/admin`} className="block text-slate-300 hover:text-white font-mono text-sm font-bold uppercase tracking-wider text-amber-500/90 border-b border-slate-800 pb-2">
              Console Dashboard
            </a>
            
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-black mb-1">Custom Post Types</span>
              <a href={`/${lang}/admin/aircrafts`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-2">
                ✈️ Aerei (Models)
              </a>
              <a href={`/${lang}/admin/airlines`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-2">
                🏢 Compagnie (Airlines)
              </a>
              <a href={`/${lang}/admin/airports`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-2">
                🌍 Aeroporti (Airports)
              </a>
              <a href={`/${lang}/admin/blog`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-2">
                📰 News (Articles)
              </a>
            </div>

            <div className="space-y-2.5 border-t border-slate-800 pt-4 mt-4">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-black mb-1">Manutenzione</span>
              <a href={`/${lang}/admin/editor`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors">
                ⚡ Quick Editor
              </a>
              <a href={`/${lang}/admin/spotters`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors">
                📸 Moderazione Spotter
              </a>
              <a href={`/${lang}/admin/image-reviews`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-1.5">
                🚩 Revisione Immagini
              </a>
            </div>

            <div className="space-y-2.5 border-t border-slate-800 pt-4 mt-4">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block font-black mb-1">Documentazione</span>
              <a href={`/${lang}/admin/docs`} className="block text-slate-300 hover:text-cyan-400 font-mono text-sm transition-colors flex items-center gap-1.5">
                📖 Manuale Progetto
              </a>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}