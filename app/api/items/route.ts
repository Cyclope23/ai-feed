import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import type { ItemType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const period = sp.get('period') ?? 'today';
  const type = sp.get('type') as ItemType | null;
  const sort = sp.get('sort') ?? 'score';
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(sp.get('limit') ?? '20', 10));

  if (sort === 'score') {
    const days = period === 'today' ? 0 : period === 'week' ? 7 : 30;
    const sinceDate = new Date(Date.now() - days * 86400000);
    const dateFilter = period === 'today' ? dateUtcString() : { gte: dateUtcString(sinceDate) };

    const rankings = await db.dailyRanking.findMany({
      where: {
        date: typeof dateFilter === 'string' ? dateFilter : (dateFilter as any),
        ...(type ? { feedItem: { type } } : {}),
      },
      orderBy: period === 'today' ? { rank: 'asc' } : { totalScore: 'desc' },
      include: { feedItem: { include: { enrichment: true, source: true } } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ items: rankings, page, limit });
  }

  const items = await db.feedItem.findMany({
    where: type ? { type } : undefined,
    orderBy: { publishedAt: 'desc' },
    include: { enrichment: true, source: true },
    skip: (page - 1) * limit,
    take: limit,
  });
  return NextResponse.json({ items, page, limit });
}
