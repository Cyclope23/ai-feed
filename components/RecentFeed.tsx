import Link from 'next/link';
import { Card } from './ui/card';

interface Props {
  items: Array<{
    slug: string;
    title: string;
    publishedAt: Date;
    source: { name: string };
  }>;
}

export function RecentFeed({ items }: Props) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold">Ultimi Arrivi</h2>
        <p className="text-zinc-500">Nessun item ancora. Il primo fetch deve ancora avvenire.</p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Ultimi Arrivi</h2>
      <div className="space-y-2">
        {items.map(i => (
          <Link key={i.slug} href={`/item/${i.slug}`}>
            <Card>
              <div className="font-medium">{i.title}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {timeAgo(i.publishedAt)} · {i.source.name}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function timeAgo(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 1) return 'pochi minuti fa';
  if (hours < 24) return `${Math.floor(hours)}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}
