import Link from 'next/link';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface Props {
  rankings: Array<{
    rank: number;
    totalScore: number;
    feedItem: {
      slug: string;
      title: string;
      type: string;
      githubStars: number | null;
    };
  }>;
}

const RANK_COLORS: Record<number, string> = {
  1: 'border-l-yellow-400',
  2: 'border-l-gray-300',
  3: 'border-l-amber-700',
};

export function RankingList({ rankings }: Props) {
  if (rankings.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold">Ranking Oggi</h2>
        <p className="text-zinc-500">Nessun ranking disponibile. Il primo fetch deve ancora avvenire.</p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Ranking Oggi ({rankings.length})</h2>
      <div className="space-y-2">
        {rankings.map(r => (
          <Link key={r.rank} href={`/item/${r.feedItem.slug}`}>
            <Card className={`flex items-center gap-3 border-l-4 ${RANK_COLORS[r.rank] ?? 'border-l-zinc-700'}`}>
              <div className="text-2xl font-bold">#{r.rank}</div>
              <div className="flex-1">
                <div className="font-medium">{r.feedItem.title}</div>
                <div className="text-xs text-zinc-500 flex gap-2">
                  <Badge className="bg-purple-100 text-purple-700">{r.feedItem.type}</Badge>
                  {r.feedItem.githubStars != null && <span>⭐ {r.feedItem.githubStars}</span>}
                  <span>Score: {r.totalScore.toFixed(0)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
