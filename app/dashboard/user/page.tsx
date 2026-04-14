import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CancelTicketForm from '@/components/CancelTicketForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

async function cancelBookingAction(formData: FormData) {
  'use server';

  const bookingId = formData.get('bookingId');
  if (typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new Error('Invalid booking id.');
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      flight: {
        select: {
          departureTime: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    throw new Error('Booking not found.');
  }

  if (booking.status === 'CANCELLED') {
    revalidatePath('/dashboard/user');
    return;
  }

  if (new Date(booking.flight.departureTime) <= new Date()) {
    throw new Error('Departed flights cannot be cancelled.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        refundStatus: 'PENDING',
        refundRequestedAt: new Date(),
      },
    });

    await tx.bookedSeat.deleteMany({
      where: { bookingId: booking.id },
    });
  });

  revalidatePath('/dashboard/user');
}

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
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
        <p className="mb-3 text-lg font-semibold text-slate-900">No trips found yet.</p>
        <p className="mb-5 text-sm text-slate-600">Start by exploring available routes and booking your first flight.</p>
        <Link href="/flights" className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700">
          Book your next adventure!
        </Link>
      </div>
    );
  }

  const now = new Date();
  const cancelledTrips = bookings.filter((b) => b.status === 'CANCELLED');
  const activeTrips = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.flight.departureTime) > now
  );
  const pastTrips = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.flight.departureTime) <= now
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Traveler Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">My Trips</h1>
          </div>
          <Link href="/flights" className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
          Book New Flight
          </Link>
        </div>
      </div>
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Active Trips</h2>
        {activeTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTrips.map((booking) => (
              <Card key={booking.id} className="rounded-2xl border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
                  {booking.status !== 'CANCELLED' && (
                    <CancelTicketForm bookingId={booking.id} action={cancelBookingAction} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No upcoming trips.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Past Trips</h2>
        {pastTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastTrips.map((booking) => (
              <Card key={booking.id} className="rounded-2xl border-slate-200 opacity-75 shadow-sm">
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

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Cancelled Trips</h2>
        {cancelledTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cancelledTrips.map((booking) => (
              <Card key={booking.id} className="rounded-2xl border-rose-200 bg-rose-50/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{booking.flight.flightNumber}</span>
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">CANCELLED</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">
                    {booking.flight.origin.iata} →{' '}
                    {booking.flight.destination.iata}
                  </p>
                  <p>
                    Departure:{' '}
                    {format(
                      new Date(booking.flight.departureTime),
                      'MMM d, yyyy h:mm a'
                    )}
                  </p>
                  <p className="text-sm text-slate-700">
                    Refund: <span className="font-semibold">{booking.refundStatus}</span>
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
          <p>No cancelled trips.</p>
        )}
      </section>
    </div>
  );
}
