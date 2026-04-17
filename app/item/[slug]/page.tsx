import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { ScoreHistoryChart } from '@/components/ScoreHistoryChart';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

interface Props {
  params: Promise<{ slug: string }>;
}

const TYPE_COLORS: Record<string, string> = {
  PLUGIN: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  NEWS: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  SKILL: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  FRAMEWORK: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
};

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const today = dateUtcString();

  const item = await db.feedItem.findUnique({
    where: { slug },
    include: {
      enrichment: true,
      source: true,
      rankings: { orderBy: { date: 'asc' } },
    },
  });

  if (!item) notFound();

  const todayRanking = item.rankings.find(r => r.date === today);
  const isGitHub = item.source.type === 'GITHUB' || item.url.includes('github.com');
  const repoPath = extractRepoPath(item.url);

  return (
    <main className="min-h-screen">
      {/* Header banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-purple-500 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Torna alla dashboard
          </Link>

          <div className="flex items-start gap-2 mb-3 flex-wrap">
            <Badge className={TYPE_COLORS[item.type] ?? 'bg-zinc-200 text-zinc-600'}>{item.type}</Badge>
            {todayRanking && (
              <Badge className="bg-yellow-500/15 text-yellow-500 border border-yellow-500/20">
                #{todayRanking.rank} oggi
              </Badge>
            )}
            {item.enrichment?.status === 'COMPLETED' && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">AI Enriched</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">{item.title}</h1>

          <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
            <span>Pubblicato {new Date(item.publishedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>Fonte: {item.source.name}</span>
            {item.githubStars != null && item.githubStars > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {item.githubStars.toLocaleString()}
              </span>
            )}
            {item.githubForks != null && item.githubForks > 0 && (
              <span>{item.githubForks.toLocaleString()} fork</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl space-y-6">
        {/* Score breakdown */}
        {todayRanking && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreCard label="Score totale" value={todayRanking.totalScore} color="purple" />
            <ScoreCard label="Popolarità" value={todayRanking.popularityScore} color="blue" />
            <ScoreCard label="Novità" value={todayRanking.noveltyScore} color="emerald" />
            <ScoreCard label="Rilevanza" value={todayRanking.relevanceScore} color="orange" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {(item.enrichment?.summary || item.description) && (
              <Card>
                <h2 className="font-semibold text-lg mb-2">Sommario</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {item.enrichment?.status === 'COMPLETED' ? item.enrichment.summary : item.description}
                </p>
              </Card>
            )}

            {item.enrichment?.status === 'COMPLETED' && item.enrichment.practicalDescription && (
              <Card>
                <h2 className="font-semibold text-lg mb-2">Descrizione pratica</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{item.enrichment.practicalDescription}</p>
              </Card>
            )}

            {item.enrichment?.status === 'COMPLETED' && item.enrichment.useCase && (
              <Card>
                <h2 className="font-semibold text-lg mb-2">Caso d&apos;uso</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{item.enrichment.useCase}</p>
              </Card>
            )}

            {item.rankings.length > 1 && (
              <Card>
                <h2 className="font-semibold text-lg mb-3">Storico Score</h2>
                <ScoreHistoryChart data={item.rankings.map(r => ({ date: r.date, totalScore: r.totalScore }))} />
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick start for GitHub repos */}
            {isGitHub && repoPath && (
              <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent dark:from-purple-500/[0.07] p-5">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Clona il repository</p>
                    <CodeBlock text={`git clone https://github.com/${repoPath}.git`} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Entra nella directory</p>
                    <CodeBlock text={`cd ${repoPath.split('/').pop()}`} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Installa le dipendenze</p>
                    <CodeBlock text="npm install" />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Controlla il README del repository per istruzioni specifiche.
                </p>
              </div>
            )}

            {/* Guide for non-GitHub items */}
            {!isGitHub && (
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-500/[0.07] p-5">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Come iniziare
                </h3>
                <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <li className="flex gap-2">
                    <span className="font-mono text-purple-500 font-bold shrink-0">1.</span>
                    Visita il sito ufficiale tramite il link qui sotto
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono text-purple-500 font-bold shrink-0">2.</span>
                    Leggi la documentazione e i requisiti
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono text-purple-500 font-bold shrink-0">3.</span>
                    Segui la guida di installazione ufficiale
                  </li>
                </ol>
              </div>
            )}

            {/* Links */}
            <Card>
              <h3 className="font-semibold text-sm mb-3 text-zinc-500 uppercase tracking-wider">Link</h3>
              <div className="space-y-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {isGitHub ? 'Apri su GitHub' : 'Vai al sito'}
                </a>
                {isGitHub && repoPath && (
                  <>
                    <a
                      href={`https://github.com/${repoPath}/issues`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Issues
                    </a>
                    <a
                      href={`https://github.com/${repoPath}/pulls`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      Pull Requests
                    </a>
                  </>
                )}
              </div>
            </Card>

            {/* Meta info */}
            <Card>
              <h3 className="font-semibold text-sm mb-3 text-zinc-500 uppercase tracking-wider">Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Tipo</dt>
                  <dd><Badge className={TYPE_COLORS[item.type] ?? 'bg-zinc-200 text-zinc-600'}>{item.type}</Badge></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Fonte</dt>
                  <dd>{item.source.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Pubblicato</dt>
                  <dd>{new Date(item.publishedAt).toLocaleDateString('it-IT')}</dd>
                </div>
                {todayRanking && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Posizione</dt>
                    <dd className="font-mono font-bold text-purple-500">#{todayRanking.rank}</dd>
                  </div>
                )}
                {item.githubStars != null && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Stars</dt>
                    <dd>{item.githubStars.toLocaleString()}</dd>
                  </div>
                )}
                {item.githubForks != null && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Forks</dt>
                    <dd>{item.githubForks.toLocaleString()}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Menzioni</dt>
                  <dd>{item.mentionCount}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function ScoreCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, { gradient: string; text: string }> = {
    purple: { gradient: 'from-purple-500 to-indigo-500', text: 'text-purple-500' },
    blue: { gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-500' },
    emerald: { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-500' },
    orange: { gradient: 'from-orange-500 to-amber-500', text: 'text-orange-500' },
  };
  const c = colorMap[color] ?? colorMap.purple;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <div className={`text-2xl font-bold font-mono ${c.text}`}>{value.toFixed(0)}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${c.gradient} rounded-full`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="bg-zinc-900 dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 overflow-x-auto">
      <code>{text}</code>
    </pre>
  );
}

function extractRepoPath(url: string): string | null {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1].replace(/\.git$/, '') : null;
}
