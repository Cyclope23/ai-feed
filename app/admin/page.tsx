'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Stats {
  today: string;
  totalItems: number;
  rankedToday: number;
  enrichedTotal: number;
  enrichedPending: number;
  enrichedFailed: number;
  activeSources: number;
  pipelineSteps: { step: string; completedAt: string }[];
}

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  category: string | null;
  isActive: boolean;
  lastFetchedAt: string | null;
}

type PipelineStep = 'fetch' | 'rank' | 'enrich';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [running, setRunning] = useState<PipelineStep | null>(null);
  const [pipelineResult, setPipelineResult] = useState<string | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'RSS', url: '', category: '' });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, sourcesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/sources'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (sourcesRes.ok) setSources(await sourcesRes.json());
    } catch {
      setError('Errore nel caricamento dati');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runStep = async (step: PipelineStep) => {
    setRunning(step);
    setPipelineResult(null);
    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      setPipelineResult(`${step}: ${JSON.stringify(data.result)}`);
      await loadData();
    } catch {
      setPipelineResult(`Errore nell'esecuzione di ${step}`);
    } finally {
      setRunning(null);
    }
  };

  const toggleSource = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setSources(prev => prev.map(s => s.id === id ? { ...s, isActive: !isActive } : s));
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Eliminare questa fonte?')) return;
    await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' });
    setSources(prev => prev.filter(s => s.id !== id));
    await loadData();
  };

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource),
    });
    if (res.ok) {
      const created = await res.json();
      setSources(prev => [...prev, created]);
      setNewSource({ name: '', type: 'RSS', url: '', category: '' });
      setShowAddSource(false);
    }
  };

  const getStepStatus = (step: string) => {
    const found = stats?.pipelineSteps.find(s => s.step === step);
    if (!found) return null;
    return new Date(found.completedAt).toLocaleTimeString('it-IT');
  };

  if (!stats) {
    return (
      <main className="container mx-auto p-6 max-w-5xl">
        <p className="text-zinc-500">Caricamento...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-5xl space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-zinc-500">Data: {stats.today}</p>
        </div>
        <Button onClick={loadData} className="bg-zinc-700 hover:bg-zinc-600">Refresh dati</Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Items totali" value={stats.totalItems} />
        <StatCard label="Ranked oggi" value={stats.rankedToday} />
        <StatCard label="Enriched" value={stats.enrichedTotal} accent="text-green-400" />
        <StatCard label="Pending / Failed" value={`${stats.enrichedPending} / ${stats.enrichedFailed}`} accent={stats.enrichedFailed > 0 ? 'text-red-400' : 'text-yellow-400'} />
      </div>

      {/* Pipeline Controls */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['fetch', 'rank', 'enrich'] as PipelineStep[]).map(step => (
            <div key={step} className="flex items-center justify-between p-3 rounded border border-zinc-800 bg-zinc-950">
              <div>
                <div className="font-medium capitalize">{step}</div>
                <div className="text-xs text-zinc-500">
                  {getStepStatus(step.toUpperCase())
                    ? `Completato alle ${getStepStatus(step.toUpperCase())}`
                    : 'Non eseguito oggi'}
                </div>
              </div>
              <Button
                onClick={() => runStep(step)}
                disabled={running !== null}
                className={running === step ? 'bg-yellow-600 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}
              >
                {running === step ? 'In corso...' : 'Esegui'}
              </Button>
            </div>
          ))}
        </div>
        {pipelineResult && (
          <pre className="mt-3 text-xs bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto text-zinc-300">
            {pipelineResult}
          </pre>
        )}
      </Card>

      {/* Sources */}
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Fonti ({sources.length})</h2>
          <Button onClick={() => setShowAddSource(!showAddSource)} className="bg-green-700 hover:bg-green-600 text-sm">
            {showAddSource ? 'Annulla' : '+ Aggiungi fonte'}
          </Button>
        </div>

        {showAddSource && (
          <form onSubmit={addSource} className="mb-4 p-3 border border-zinc-800 rounded bg-zinc-950 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text" placeholder="Nome" required value={newSource.name}
                onChange={e => setNewSource(p => ({ ...p, name: e.target.value }))}
                className="p-2 bg-zinc-900 border border-zinc-700 rounded text-sm"
              />
              <select
                value={newSource.type}
                onChange={e => setNewSource(p => ({ ...p, type: e.target.value }))}
                className="p-2 bg-zinc-900 border border-zinc-700 rounded text-sm"
              >
                <option value="RSS">RSS</option>
                <option value="GITHUB">GitHub</option>
              </select>
            </div>
            <input
              type="url" placeholder="URL" required value={newSource.url}
              onChange={e => setNewSource(p => ({ ...p, url: e.target.value }))}
              className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-sm"
            />
            <input
              type="text" placeholder="Categoria (opzionale)" value={newSource.category}
              onChange={e => setNewSource(p => ({ ...p, category: e.target.value }))}
              className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded text-sm"
            />
            <Button type="submit" className="bg-green-700 hover:bg-green-600 text-sm">Salva</Button>
          </form>
        )}

        <div className="space-y-2">
          {sources.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded border border-zinc-800 bg-zinc-950">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  <Badge className={s.type === 'RSS' ? 'bg-blue-900 text-blue-300' : 'bg-zinc-800 text-zinc-300'}>{s.type}</Badge>
                  {s.category && <Badge className="bg-zinc-800 text-zinc-400">{s.category}</Badge>}
                </div>
                <div className="text-xs text-zinc-500 truncate">{s.url}</div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  onClick={() => toggleSource(s.id, s.isActive)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${s.isActive ? 'bg-green-600' : 'bg-zinc-700'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${s.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => deleteSource(s.id)} className="text-red-500 hover:text-red-400 text-sm px-1" title="Elimina">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="text-center">
      <div className={`text-2xl font-bold ${accent ?? ''}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </Card>
  );
}
