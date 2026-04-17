import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const baseUrl = req.nextUrl.origin;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

  fetch(`${baseUrl}/api/cron/fetch`, { headers }).catch(console.error);

  return NextResponse.json({ ok: true, triggered: 'fetch' });
});
