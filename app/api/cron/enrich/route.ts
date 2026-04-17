import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrichItem } from '@/lib/services/ai-enricher';
import { ENRICHMENT_MODEL } from '@/lib/anthropic';
import { isStepCompleted, markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  if (!(await isStepCompleted('RANK', today))) {
    return NextResponse.json({ skipped: true, reason: 'rank not completed' });
  }

  const items = await db.feedItem.findMany({
    where: {
      OR: [
        { enrichment: null },
        { enrichment: { status: 'PENDING', retryCount: { lt: MAX_RETRIES } } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await enrichItem({
        title: item.title,
        description: item.description,
        content: item.content,
      });
      await db.aIEnrichment.upsert({
        where: { feedItemId: item.id },
        update: {
          summary: result.summary,
          practicalDescription: result.practicalDescription,
          useCase: result.useCase,
          generatedAt: new Date(),
          model: ENRICHMENT_MODEL,
          status: 'COMPLETED',
        },
        create: {
          feedItemId: item.id,
          summary: result.summary,
          practicalDescription: result.practicalDescription,
          useCase: result.useCase,
          generatedAt: new Date(),
          model: ENRICHMENT_MODEL,
          status: 'COMPLETED',
        },
      });
      succeeded++;
    } catch (err) {
      console.error(`[enrich] error on item ${item.id}:`, err);
      const existing = await db.aIEnrichment.findUnique({ where: { feedItemId: item.id } });
      const newCount = (existing?.retryCount ?? 0) + 1;
      await db.aIEnrichment.upsert({
        where: { feedItemId: item.id },
        update: {
          retryCount: newCount,
          status: newCount >= MAX_RETRIES ? 'FAILED' : 'PENDING',
        },
        create: {
          feedItemId: item.id,
          retryCount: 1,
          status: 'PENDING',
        },
      });
      failed++;
    }
  }

  await markStepCompleted('ENRICH', today);
  return NextResponse.json({ ok: true, succeeded, failed, batch: BATCH_SIZE });
}
