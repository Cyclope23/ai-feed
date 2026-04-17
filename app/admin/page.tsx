import { db } from '@/lib/db';

export default async function AdminPage() {
  const sources = await db.source.findMany({ orderBy: { name: 'asc' } });
  const lastFetch = await db.pipelineStatus.findFirst({
    where: { step: 'FETCH' }, orderBy: { completedAt: 'desc' },
  });

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </header>
      <p className="mb-4">Ultimo fetch: {lastFetch?.completedAt.toLocaleString('it-IT') ?? 'mai'}</p>
      <h2 className="text-xl font-semibold mb-2">Fonti ({sources.length})</h2>
      <ul className="space-y-2">
        {sources.map(s => (
          <li key={s.id} className="p-3 border rounded flex justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-zinc-500">{s.type} - {s.url}</div>
            </div>
            <span className={s.isActive ? 'text-green-600' : 'text-zinc-400'}>
              {s.isActive ? 'Attiva' : 'Disattiva'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
