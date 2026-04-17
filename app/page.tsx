import { Suspense } from 'react';
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { RankingList } from '@/components/RankingList';
import { RecentFeed } from '@/components/RecentFeed';
import { CategoryFilter } from '@/components/CategoryFilter';
import type { ItemType } from '@prisma/client';

export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const today = dateUtcString();
  const itemType = type as ItemType | undefined;

  const rankings = await db.dailyRanking.findMany({
    where: {
      date: today,
      ...(itemType ? { feedItem: { type: itemType } } : {}),
    },
    orderBy: { rank: 'asc' },
    include: { feedItem: true },
    take: 10,
  });

  const recent = await db.feedItem.findMany({
    where: itemType ? { type: itemType } : undefined,
    orderBy: { publishedAt: 'desc' },
    include: { source: true },
    take: 10,
  });

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">AI Feeds</h1>
        <p className="text-zinc-500">Le novita dell ecosistema Claude, classificate ogni giorno</p>
      </header>
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingList rankings={rankings} />
        <RecentFeed items={recent} />
      </div>
    </main>
  );
}
