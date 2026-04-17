import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => { process.env.CRON_SECRET = 'test-secret'; });

vi.mock('@/lib/db', () => ({
  db: {
    pipelineStatus: { findUnique: vi.fn().mockResolvedValue(null) },
    feedItem: { findMany: vi.fn().mockResolvedValue([]) },
    dailyRanking: { deleteMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

import { NextRequest } from 'next/server';

describe('cron gating', () => {
  it('rank skips when fetch incomplete', async () => {
    const { GET } = await import('@/app/api/cron/rank/route');
    const req = new NextRequest('http://localhost/api/cron/rank', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toMatch(/fetch/);
  });
});
