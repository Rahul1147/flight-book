import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { PrismaClient, FlightStatus } from '@prisma/client';
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

const prisma = new PrismaClient();

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
      <div>
        <h1 className="text-2xl font-bold">Airport Manager Dashboard</h1>
        <p className="text-red-500 mt-4">
          Your account is not associated with any airport. Please contact an
          administrator.
        </p>
      </div>
    );
  }

  const airport = await prisma.airport.findUnique({
    where: { id: user.managedAirportId },
  });

  const flights = await prisma.flight.findMany({
    where: { originId: user.managedAirportId },
    include: {
      destination: true,
    },
    orderBy: {
      departureTime: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Airport Manager Dashboard</h1>
        <p className="text-lg text-gray-600">
          Departures Board for {airport?.name} ({airport?.iata})
        </p>
      </div>
      <div className="border rounded-lg">
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
       {flights.length === 0 && <p>No departures found for this airport.</p>}
    </div>
  );
}

