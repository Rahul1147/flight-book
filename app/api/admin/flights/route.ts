import { NextResponse } from 'next/server';
import { getSessionAndRole, isAdminRole } from '@/lib/route-auth';
import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  const where: Prisma.FlightWhereInput = {};
  if (origin) where.origin = { iata: origin.toUpperCase() };
  if (destination) where.destination = { iata: destination.toUpperCase() };

  const flights = await prisma.flight.findMany({
    where,
    include: {
      origin: true,
      destination: true,
      airline: true,
      airplane: true,
    },
    orderBy: [{ departureTime: 'asc' }],
  });

  return NextResponse.json(flights);
}

export async function POST(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const data = await request.json();

  if (!data.flightNumber || !data.originId || !data.destinationId || !data.airlineId || !data.airplaneId || !data.departureTime || !data.arrivalTime || !data.basePrice) {
    return NextResponse.json({ error: 'Missing mandatory flight fields' }, { status: 400 });
  }

  const durationMins = Math.round((new Date(data.arrivalTime).getTime() - new Date(data.departureTime).getTime()) / 60000);

  const flight = await prisma.flight.create({
    data: {
      flightNumber: data.flightNumber,
      originId: data.originId,
      destinationId: data.destinationId,
      airlineId: data.airlineId,
      airplaneId: data.airplaneId,
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
      durationMins,
      basePrice: Number(data.basePrice),
      status: data.status || 'SCHEDULED',
    },
  });

  return NextResponse.json(flight, { status: 201 });
}
