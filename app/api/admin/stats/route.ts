import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { dateUtcString } from '@/lib/utils/date';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = dateUtcString();

  const [
    totalItems,
    rankedToday,
    enrichedTotal,
    enrichedPending,
    enrichedFailed,
    sources,
    pipelineSteps,
  ] = await Promise.all([
    db.feedItem.count(),
    db.dailyRanking.count({ where: { date: today } }),
    db.aIEnrichment.count({ where: { status: 'COMPLETED' } }),
    db.aIEnrichment.count({ where: { status: 'PENDING' } }),
    db.aIEnrichment.count({ where: { status: 'FAILED' } }),
    db.source.count({ where: { isActive: true } }),
    db.pipelineStatus.findMany({
      where: { date: today },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    today,
    totalItems,
    rankedToday,
    enrichedTotal,
    enrichedPending,
    enrichedFailed,
    activeSources: sources,
    pipelineSteps: pipelineSteps.map(s => ({
      step: s.step,
      completedAt: s.completedAt.toISOString(),
    })),
  });
});
