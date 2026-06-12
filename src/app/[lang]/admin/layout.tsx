// src/app/[lang]/admin/layout.tsx
// Aggiungi 'params' tra le props
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const { lang } = await params; // Risoluzione asincrona del parametro

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 hidden md:block">
        <h2 className="text-amber-500 font-black text-xl mb-8 tracking-tighter">AIRDEX ADMIN</h2>
        <nav className="space-y-4">
          <a href={`/${lang}/admin`} className="block text-slate-300 hover:text-white font-mono text-sm">Dashboard</a>
          <a href={`/${lang}/admin/editor`} className="block text-slate-300 hover:text-white font-mono text-sm">Quick Editor</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}