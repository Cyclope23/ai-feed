import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

interface Props {
  params: Promise<{ date: string }>;
}

export default async function RankingDatePage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const rankings = await db.dailyRanking.findMany({
    where: { date },
    orderBy: { rank: 'asc' },
    include: { feedItem: true },
  });

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <Link href="/" className="text-sm text-purple-500">&larr; Torna alla dashboard</Link>
      <h1 className="text-3xl font-bold my-4">Ranking del {date}</h1>
      {rankings.length === 0 ? (
        <p className="text-zinc-500">Nessun ranking disponibile per questa data.</p>
      ) : (
        <div className="space-y-2">
          {rankings.map(r => (
            <Link key={r.id} href={`/item/${r.feedItem.slug}`}>
              <Card className="flex items-center gap-3">
                <div className="text-2xl font-bold">#{r.rank}</div>
                <div className="flex-1">
                  <div className="font-medium">{r.feedItem.title}</div>
                  <div className="text-xs text-zinc-500 flex gap-2">
                    <Badge className="bg-purple-100 text-purple-700">{r.feedItem.type}</Badge>
                    <span>Score: {r.totalScore.toFixed(0)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
