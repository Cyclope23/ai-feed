import { Suspense } from 'react';
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { RankingList } from '@/components/RankingList';
import type { ItemType, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string; q?: string; enriched?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { type, page, q, enriched } = await searchParams;
  const today = dateUtcString();
  const itemType = type as ItemType | undefined;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const perPage = 20;
  const search = q?.trim() ?? '';
  const onlyEnriched = enriched === '1';

  const where: Prisma.DailyRankingWhereInput = { date: today };

  const feedItemFilter: Prisma.FeedItemWhereInput = {};
  if (itemType) feedItemFilter.type = itemType;
  if (search) feedItemFilter.title = { contains: search, mode: 'insensitive' };
  if (onlyEnriched) feedItemFilter.enrichment = { is: { status: 'COMPLETED' } };

  if (Object.keys(feedItemFilter).length > 0) {
    where.feedItem = { is: feedItemFilter };
  }

  const [rankings, totalCount] = await Promise.all([
    db.dailyRanking.findMany({
      where,
      orderBy: { rank: 'asc' },
      include: {
        feedItem: {
          include: { enrichment: true, source: true },
        },
      },
      skip: (currentPage - 1) * perPage,
      take: perPage,
    }),
    db.dailyRanking.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-6 py-10 max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">AI</div>
            <h1 className="text-3xl font-bold tracking-tight">AI Feeds</h1>
          </div>
          <p className="text-zinc-500 text-lg">Le novit&agrave; dell&apos;ecosistema Claude, classificate ogni giorno</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 max-w-6xl">
        <Suspense fallback={null}>
          <RankingList
            rankings={rankings}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            currentType={type}
            currentSearch={search}
            currentEnriched={onlyEnriched}
          />
        </Suspense>
      </div>
    </main>
  );
}
