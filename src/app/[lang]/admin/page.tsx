export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-black text-white mb-6">Console di Comando</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm">Totale Varianti</h3>
          <p className="text-4xl font-bold text-white mt-2">450</p>
        </div>
        {/* Placeholder per altre statistiche */}
      </div>
    </div>
  );
}