import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export default async function UserDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      flight: {
        include: {
          origin: true,
          destination: true,
          airline: true,
        },
      },
      passengers: true,
    },
    orderBy: {
      flight: {
        departureTime: 'desc',
      },
    },
  });

  if (bookings.length === 0) {
    return (
      <div className="text-center">
        <p className="text-lg mb-4">No trips found.</p>
        <Link href="/flights" className="text-blue-500 hover:underline">
          Book your next adventure!
        </Link>
      </div>
    );
  }

  const now = new Date();
  const activeTrips = bookings.filter(
    (b) => new Date(b.flight.departureTime) > now
  );
  const pastTrips = bookings.filter(
    (b) => new Date(b.flight.departureTime) <= now
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <Link href="/flights" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          Book New Flight
        </Link>
      </div>
      <section>
        <h2 className="text-2xl font-bold mb-4">Active Trips</h2>
        {activeTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTrips.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{booking.flight.flightNumber}</span>
                    <Badge variant="secondary">{booking.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">
                    {booking.flight.origin.iata} →{' '}
                    {booking.flight.destination.iata}
                  </p>
                  <p>
                    Departs:{' '}
                    {format(
                      new Date(booking.flight.departureTime),
                      'MMM d, yyyy h:mm a'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {booking.passengers.map((p) => (
                      <Badge key={p.id} variant="outline">
                        Seat: {p.seatLabel}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No upcoming trips.</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Past Trips</h2>
        {pastTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastTrips.map((booking) => (
              <Card key={booking.id} className="opacity-70">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{booking.flight.flightNumber}</span>
                     <Badge variant="secondary">{booking.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">
                    {booking.flight.origin.iata} →{' '}
                    {booking.flight.destination.iata}
                  </p>
                  <p>
                    Departed:{' '}
                    {format(
                      new Date(booking.flight.departureTime),
                      'MMM d, yyyy h:mm a'
                    )}
                  </p>
                   <div className="flex flex-wrap gap-2 pt-2">
                    {booking.passengers.map((p) => (
                      <Badge key={p.id} variant="outline">
                        Seat: {p.seatLabel}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No past trips.</p>
        )}
      </section>
    </div>
  );
}
