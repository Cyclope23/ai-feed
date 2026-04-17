import { NextRequest, NextResponse } from 'next/server';

export function authorizeCron(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
