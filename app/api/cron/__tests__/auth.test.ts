import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

beforeAll(() => { process.env.CRON_SECRET = 'test-secret'; });

describe('cron auth', () => {
  it('rejects missing Authorization header with 401', async () => {
    const { GET } = await import('@/app/api/cron/fetch/route');
    const req = new NextRequest('http://localhost/api/cron/fetch');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('rejects wrong secret with 401', async () => {
    const { GET } = await import('@/app/api/cron/fetch/route');
    const req = new NextRequest('http://localhost/api/cron/fetch', {
      headers: { authorization: 'Bearer wrong' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
