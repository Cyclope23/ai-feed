'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Badge } from './ui/badge';

const TYPES = [
  { value: '', label: 'Tutti' },
  { value: 'PLUGIN', label: 'Plugin' },
  { value: 'NEWS', label: 'News' },
  { value: 'SKILL', label: 'Skill' },
  { value: 'FRAMEWORK', label: 'Framework' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  PLUGIN: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  NEWS: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  SKILL: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  FRAMEWORK: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
};

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface Ranking {
  rank: number;
  totalScore: number;
  popularityScore: number;
  noveltyScore: number;
  relevanceScore: number;
  feedItem: {
    slug: string;
    title: string;
    type: string;
    description: string | null;
    url: string;
    githubStars: number | null;
    githubForks: number | null;
    publishedAt: string | Date;
    source: { name: string };
    enrichment: { summary: string; status: string } | null;
  };
}

interface Props {
  rankings: Ranking[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentType?: string;
  currentSearch: string;
}

export function RankingList({ rankings, totalCount, currentPage, totalPages, currentType, currentSearch }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const navigate = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (!v || v === '') params.delete(k);
      else params.set(k, v);
    }
    // Reset to page 1 on filter/search change unless explicitly setting page
    if (!('page' in overrides)) params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: search || undefined });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Type filters */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(t => {
            const active = (currentType ?? '') === t.value;
            return (
              <button
                key={t.value}
                onClick={() => navigate({ type: t.value || undefined })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/60'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 sm:max-w-xs ml-auto">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </form>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">{totalCount} risultati{currentSearch && ` per "${currentSearch}"`}</p>
      </div>

      {/* List */}
      {rankings.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">Nessun risultato</p>
          <p className="text-sm mt-1">Prova a cambiare i filtri o la ricerca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map(r => (
            <RankingCard key={r.rank} ranking={r} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <PaginationButton
            disabled={currentPage <= 1}
            onClick={() => navigate({ page: String(currentPage - 1) })}
            label="←"
          />
          {pageRange(currentPage, totalPages).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-zinc-500">...</span>
            ) : (
              <PaginationButton
                key={p}
                active={p === currentPage}
                onClick={() => navigate({ page: String(p) })}
                label={String(p)}
              />
            )
          )}
          <PaginationButton
            disabled={currentPage >= totalPages}
            onClick={() => navigate({ page: String(currentPage + 1) })}
            label="→"
          />
        </div>
      )}
    </div>
  );
}

function RankingCard({ ranking: r }: { ranking: Ranking }) {
  const medal = MEDAL[r.rank];
  const date = new Date(r.feedItem.publishedAt);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / 86400000);
  const timeLabel = daysAgo === 0 ? 'Oggi' : daysAgo === 1 ? 'Ieri' : `${daysAgo}g fa`;
  const summary = r.feedItem.enrichment?.status === 'COMPLETED'
    ? r.feedItem.enrichment.summary
    : r.feedItem.description;
  const truncated = summary && summary.length > 140 ? summary.slice(0, 140) + '...' : summary;

  return (
    <Link href={`/item/${r.feedItem.slug}`} className="block group">
      <div className={`relative rounded-xl border transition-all hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-500/30 ${
        r.rank <= 3
          ? 'border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent dark:from-purple-500/[0.07]'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
      } p-4`}>
        <div className="flex gap-4">
          {/* Rank */}
          <div className="flex flex-col items-center justify-center w-12 shrink-0">
            {medal ? (
              <span className="text-2xl">{medal}</span>
            ) : (
              <span className="text-xl font-bold text-zinc-400 dark:text-zinc-600 font-mono">
                {r.rank}
              </span>
            )}
            <div className="mt-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, r.totalScore)}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[15px] leading-tight group-hover:text-purple-500 transition-colors truncate">
                {r.feedItem.title}
              </h3>
              <span className="text-xs text-zinc-500 shrink-0 mt-0.5">{timeLabel}</span>
            </div>

            {truncated && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{truncated}</p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={TYPE_COLORS[r.feedItem.type] ?? 'bg-zinc-200 text-zinc-600'}>
                {r.feedItem.type}
              </Badge>
              {r.feedItem.githubStars != null && r.feedItem.githubStars > 0 && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {formatNumber(r.feedItem.githubStars)}
                </span>
              )}
              {r.feedItem.githubForks != null && r.feedItem.githubForks > 0 && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  {formatNumber(r.feedItem.githubForks)}
                </span>
              )}
              <span className="text-xs text-zinc-500 ml-auto">{r.feedItem.source.name}</span>
              <span className="text-xs font-mono text-purple-500/80">{r.totalScore.toFixed(0)}pt</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PaginationButton({ active, disabled, onClick, label }: { active?: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
          : disabled
            ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/60'
      }`}
    >
      {label}
    </button>
  );
}

function pageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | null)[] = [1];
  if (current > 3) pages.push(null);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push(null);
  pages.push(total);
  return pages;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
