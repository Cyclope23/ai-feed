import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn().mockResolvedValue({
        items: [
          { title: 'Item 1', link: 'https://example.com/1', isoDate: '2026-04-15T10:00:00Z', contentSnippet: 'desc' },
          { title: 'Item 2', link: 'https://example.com/2', isoDate: '2026-04-15T11:00:00Z' },
        ],
      }),
    })),
  };
});

import { fetchRssFeed } from '../feed-fetcher';

describe('fetchRssFeed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('parses RSS and returns normalized items', async () => {
    const items = await fetchRssFeed('https://example.com/feed.xml');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Item 1');
    expect(items[0].url).toBe('https://example.com/1');
    expect(items[0].publishedAt).toBeInstanceOf(Date);
  });

  it('returns empty array on error', async () => {
    const Parser = (await import('rss-parser')).default as any;
    Parser.mockImplementationOnce(() => ({
      parseURL: vi.fn().mockRejectedValue(new Error('network')),
    }));
    const items = await fetchRssFeed('https://broken.example.com/feed.xml');
    expect(items).toEqual([]);
  });
});
