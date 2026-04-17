import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateStudyGuide } from '@/lib/services/study-generator';
import { ENRICHMENT_MODEL } from '@/lib/anthropic';

export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const item = await db.feedItem.findUnique({
    where: { slug },
    include: { enrichment: true, studyGuide: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Return existing guide if already generated
  if (item.studyGuide) {
    return NextResponse.json({
      content: item.studyGuide.content,
      generatedAt: item.studyGuide.generatedAt,
      cached: true,
    });
  }

  try {
    const content = await generateStudyGuide({
      title: item.title,
      url: item.url,
      type: item.type,
      description: item.description,
      content: item.content,
      enrichmentSummary: item.enrichment?.summary,
      enrichmentPractical: item.enrichment?.practicalDescription,
      enrichmentUseCase: item.enrichment?.useCase,
    });

    const guide = await db.studyGuide.upsert({
      where: { feedItemId: item.id },
      update: { content, model: ENRICHMENT_MODEL, generatedAt: new Date() },
      create: { feedItemId: item.id, content, model: ENRICHMENT_MODEL },
    });

    return NextResponse.json({
      content: guide.content,
      generatedAt: guide.generatedAt,
      cached: false,
    });
  } catch (err: any) {
    console.error(`[study] Error generating guide for ${slug}:`, err);
    return NextResponse.json(
      { error: 'Failed to generate study guide' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const item = await db.feedItem.findUnique({
    where: { slug },
    include: { studyGuide: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  if (!item.studyGuide) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    content: item.studyGuide.content,
    generatedAt: item.studyGuide.generatedAt,
  });
}
