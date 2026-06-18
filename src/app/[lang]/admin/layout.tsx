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
            <a href={`/${lang}/admin`} className="block text-slate-300 hover:text-white font-mono text-sm">Dashboard</a>
            <a href={`/${lang}/admin/editor`} className="block text-slate-300 hover:text-white font-mono text-sm">Quick Editor</a>
            <a href={`/${lang}/admin/spotters`} className="block text-slate-300 hover:text-white font-mono text-sm">Moderazione Spotter</a>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}