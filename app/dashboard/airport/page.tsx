import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { FlightStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import FlightStatusSelect from '@/components/FlightStatusSelect';
import { prisma } from '@/lib/prisma';

async function updateFlightStatus(flightId: string, status: FlightStatus) {
  'use server';
  await prisma.flight.update({
    where: { id: flightId },
    data: { status },
  });
  revalidatePath('/dashboard/airport');
}

export default async function AirportManagerDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, managedAirportId: true },
  });

  if (user?.role !== 'AIRPORT_MANAGER') {
    redirect('/login');
  }

  if (!user?.managedAirportId) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Airport Manager Dashboard</h1>
        <p className="mt-3 text-red-700">
          Your account is not associated with any airport. Please contact an
          administrator.
        </p>
      </div>
    );
  }

  const [airport, flights] = await Promise.all([
    prisma.airport.findUnique({
      where: { id: user.managedAirportId },
      select: { id: true, name: true, iata: true },
    }),
    prisma.flight.findMany({
      where: { originId: user.managedAirportId },
      include: {
        destination: {
          select: { city: true, iata: true },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Airport Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Airport Manager Dashboard</h1>
        <p className="mt-2 text-base text-gray-600">
          Departures Board for {airport?.name} ({airport?.iata})
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flight #</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flights.map((flight) => (
              <TableRow key={flight.id}>
                <TableCell className="font-medium">{flight.flightNumber}</TableCell>
                <TableCell>{flight.destination.city} ({flight.destination.iata})</TableCell>
                <TableCell>
                  {format(new Date(flight.departureTime), 'h:mm a')}
                </TableCell>
                <TableCell>
                  <FlightStatusSelect
                    flightId={flight.id}
                    value={flight.status}
                    onStatusChange={updateFlightStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {flights.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600">
          No departures found for this airport.
        </p>
      )}
    </div>
  );
}

