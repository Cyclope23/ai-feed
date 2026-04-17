import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sources = await db.source.findMany();
  return NextResponse.json(sources);
});

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const created = await db.source.create({
    data: {
      name: body.name,
      type: body.type,
      url: body.url,
      category: body.category,
    },
  });
  return NextResponse.json(created);
});
