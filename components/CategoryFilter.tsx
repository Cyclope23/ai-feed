'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const TYPES = ['ALL', 'PLUGIN', 'NEWS', 'SKILL', 'FRAMEWORK'] as const;

export function CategoryFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get('type') ?? 'ALL';

  const setType = (t: string) => {
    const newSp = new URLSearchParams(sp.toString());
    if (t === 'ALL') newSp.delete('type');
    else newSp.set('type', t);
    router.push(`/?${newSp.toString()}`);
  };

  return (
    <div className="flex gap-2 mb-4">
      {TYPES.map(t => (
        <button
          key={t}
          onClick={() => setType(t)}
          className={`px-3 py-1 rounded text-sm ${current === t ? 'bg-purple-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
