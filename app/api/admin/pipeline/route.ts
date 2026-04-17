import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const VALID_STEPS = ['fetch', 'rank', 'enrich'] as const;

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { step } = await req.json();
  if (!VALID_STEPS.includes(step)) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  }

  const baseUrl = req.nextUrl.origin;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

  const res = await fetch(`${baseUrl}/api/cron/${step}`, { headers });
  const data = await res.json();

  return NextResponse.json({ ok: true, step, result: data });
});
