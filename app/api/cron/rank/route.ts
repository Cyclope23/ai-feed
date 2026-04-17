import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  noveltyScore, popularityScore, relevanceScore, totalScore,
} from '@/lib/services/ranking-engine';
import { isStepCompleted, markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  if (!(await isStepCompleted('FETCH', today))) {
    return NextResponse.json({ skipped: true, reason: 'fetch not completed' });
  }

  const items = await db.feedItem.findMany({
    where: {
      publishedAt: { gte: new Date(Date.now() - 30 * 86400000) },
    },
  });

  const scored = items.map(item => {
    const novelty = noveltyScore(item.publishedAt);
    const popularity = popularityScore({
      stars: item.githubStars,
      forks: item.githubForks,
      mentions: item.mentionCount,
    });
    const relevance = relevanceScore({
      title: item.title,
      content: item.content ?? item.description,
    });
    const total = totalScore({ novelty, popularity, relevance });
    return { item, novelty, popularity, relevance, total };
  });

  scored.sort((a, b) => b.total - a.total);

  // Wrap in transaction to avoid empty-state window during recompute
  await db.$transaction([
    db.dailyRanking.deleteMany({ where: { date: today } }),
    ...scored.map((s, i) =>
      db.dailyRanking.create({
        data: {
          feedItemId: s.item.id,
          date: today,
          noveltyScore: s.novelty,
          popularityScore: s.popularity,
          relevanceScore: s.relevance,
          totalScore: s.total,
          rank: i + 1,
        },
      })
    ),
  ]);

  await markStepCompleted('RANK', today);
  return NextResponse.json({ ok: true, ranked: scored.length, date: today });
}
