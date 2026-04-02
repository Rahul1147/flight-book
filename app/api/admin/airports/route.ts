import { NextResponse } from 'next/server';
import { getSessionAndRole, isAdminRole } from '@/lib/route-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const airports = await prisma.airport.findMany({ orderBy: { city: 'asc' } });
  return NextResponse.json(airports);
}

export async function POST(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const data = await request.json();
  const required = ['iata', 'name', 'city', 'country'];
  for (const field of required) {
    if (!data[field]) {
      return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
    }
  }

  const airport = await prisma.airport.create({
    data: {
      iata: data.iata.toUpperCase(),
      name: data.name,
      city: data.city,
      country: data.country,
    },
  });
  return NextResponse.json(airport, { status: 201 });
}
