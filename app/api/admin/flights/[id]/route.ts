import { NextResponse } from 'next/server';
import { getSessionAndRole, isAdminRole } from '@/lib/route-auth';
import { prisma } from '@/lib/prisma';

type IdParam = { id: string };

type RouteContext = { params: IdParam } | { params: Promise<IdParam> };

const resolveId = async (params: IdParam | Promise<IdParam>) => {
  const resolved = await params;
  return resolved.id;
};

export async function GET(request: Request, context: RouteContext) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = await resolveId(context.params);
  const flight = await prisma.flight.findUnique({
    where: { id },
    include: { origin: true, destination: true, airline: true, airplane: true },
  });

  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
  return NextResponse.json(flight);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = await resolveId(context.params);
  const data = await request.json();

  if (data.departureTime && data.arrivalTime) {
    data.durationMins = Math.round((new Date(data.arrivalTime).getTime() - new Date(data.departureTime).getTime()) / 60000);
  }

  const flight = await prisma.flight.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    include: {
      origin: true,
      destination: true,
      airline: true,
      airplane: true,
    },
  });

  return NextResponse.json(flight);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = await resolveId(context.params);
  await prisma.flight.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
