import { db } from '@/lib/db';
import type { PipelineStep } from '@prisma/client';

export async function markStepCompleted(step: PipelineStep, date: string): Promise<void> {
  await db.pipelineStatus.upsert({
    where: { step_date: { step, date } },
    update: { completedAt: new Date() },
    create: { step, date, completedAt: new Date() },
  });
}

export async function isStepCompleted(step: PipelineStep, date: string): Promise<boolean> {
  const rec = await db.pipelineStatus.findUnique({
    where: { step_date: { step, date } },
  });
  return rec !== null;
}
