import { NextResponse } from 'next/server';
import { getSessionAndRole, isAdminRole } from '@/lib/route-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const airlines = await prisma.airline.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(airlines);
}

export async function POST(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const data = await request.json();
  const required = ['name', 'code'];
  for (const field of required) {
    if (!data[field]) {
      return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
    }
  }

  const airline = await prisma.airline.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      logoUrl: data.logoUrl || null,
    },
  });
  return NextResponse.json(airline, { status: 201 });
}
