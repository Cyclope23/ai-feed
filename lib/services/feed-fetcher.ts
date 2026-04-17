import Parser from 'rss-parser';

export interface NormalizedFeedItem {
  title: string;
  url: string;
  description: string | null;
  content: string | null;
  publishedAt: Date;
}

export async function fetchRssFeed(url: string): Promise<NormalizedFeedItem[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    return (feed.items ?? [])
      .filter(i => i.link && i.title)
      .map(i => ({
        title: i.title!,
        url: i.link!,
        description: i.contentSnippet ?? null,
        content: (i as any).content ?? null,
        publishedAt: i.isoDate ? new Date(i.isoDate) : new Date(),
      }));
  } catch (err) {
    console.error(`[FeedFetcher] Error for ${url}:`, err);
    return [];
  }
}
