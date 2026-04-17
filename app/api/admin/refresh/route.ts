import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

  fetch(`${baseUrl}/api/cron/fetch`, { headers }).catch(console.error);

  return NextResponse.json({ ok: true, triggered: 'fetch' });
}
