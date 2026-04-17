import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const sources = await db.source.findMany();
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
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
}
