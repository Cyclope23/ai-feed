import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { ItemHeader } from '@/components/ItemHeader';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { ScoreHistoryChart } from '@/components/ScoreHistoryChart';
import { Card } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 1800;

interface Props {
  params: Promise<{ slug: string }>;
}

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

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <Link href="/" className="text-sm text-purple-500">← Torna alla dashboard</Link>
      <ItemHeader
        type={item.type}
        title={item.title}
        publishedAt={item.publishedAt}
        rank={todayRanking?.rank}
      />

      {todayRanking && (
        <div className="mb-6">
          <ScoreBreakdown
            novelty={todayRanking.noveltyScore}
            popularity={todayRanking.popularityScore}
            relevance={todayRanking.relevanceScore}
            total={todayRanking.totalScore}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="font-semibold mb-2">Descrizione Pratica</h3>
          <p>{item.enrichment?.practicalDescription || item.description || 'In elaborazione...'}</p>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Use Case</h3>
          <p>{item.enrichment?.useCase || 'In elaborazione...'}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold mb-2">Storico Score</h3>
        <ScoreHistoryChart data={item.rankings.map(r => ({ date: r.date, totalScore: r.totalScore }))} />
      </Card>

      <div className="flex gap-2">
        <a href={item.url} target="_blank" rel="noopener noreferrer"
           className="px-4 py-2 bg-purple-600 text-white rounded">
          Vai al sito
        </a>
        <span className="text-sm text-zinc-500 self-center">Fonte: {item.source.name}</span>
      </div>
    </main>
  );
}
