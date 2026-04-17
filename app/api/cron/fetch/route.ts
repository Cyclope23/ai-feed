import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchRssFeed } from '@/lib/services/feed-fetcher';
import { searchGithubRepos } from '@/lib/services/github-scanner';
import { classifyItem } from '@/lib/services/item-classifier';
import { markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { slugify } from '@/lib/utils/slug';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  const sources = await db.source.findMany({ where: { isActive: true } });
  let inserted = 0;

  for (const source of sources) {
    try {
      if (source.type === 'RSS') {
        const items = await fetchRssFeed(source.url);
        for (const item of items) {
          await upsertItem(source.id, source.type, item, []);
          inserted++;
        }
      } else if (source.type === 'GITHUB') {
        const isFirstRun = !source.lastFetchedAt;
        const repos = await searchGithubRepos(source.url, {
          sinceDays: isFirstRun ? 30 : 1,
          limit: 100,
        });
        for (const repo of repos) {
          await upsertItem(source.id, source.type, {
            title: repo.title,
            url: repo.url,
            description: repo.description,
            content: null,
            publishedAt: repo.publishedAt,
            githubStars: repo.githubStars,
            githubForks: repo.githubForks,
          }, repo.topics);
          inserted++;
        }
      }
      await db.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });
    } catch (err) {
      console.error(`[fetch] error on source ${source.name}:`, err);
    }
  }

  await markStepCompleted('FETCH', today);
  return NextResponse.json({ ok: true, inserted, sources: sources.length, date: today });
}

async function upsertItem(
  sourceId: string,
  sourceType: 'RSS' | 'GITHUB',
  data: any,
  topics: string[]
) {
  const type = classifyItem({
    sourceType,
    title: data.title,
    description: data.description,
    topics,
  });

  const slug = slugify(data.title);

  await db.feedItem.upsert({
    where: { url: data.url },
    update: {
      title: data.title,
      description: data.description,
      content: data.content,
      githubStars: data.githubStars,
      githubForks: data.githubForks,
      mentionCount: { increment: 1 },
      type,
    },
    create: {
      sourceId,
      title: data.title,
      slug,
      url: data.url,
      description: data.description,
      content: data.content,
      publishedAt: data.publishedAt,
      type,
      githubStars: data.githubStars,
      githubForks: data.githubForks,
    },
  });
}
