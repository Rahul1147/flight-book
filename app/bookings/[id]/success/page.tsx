import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

type SuccessPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingSuccessPage({ params }: SuccessPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/login');

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      flight: {
        include: {
          origin: true,
          destination: true,
          airline: true,
        },
      },
      passengers: true,
      bookedSeats: true,
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    notFound();
  }

  return (
    <main className="py-4 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 p-8 text-center text-white shadow-lg">
          <h1 className="text-3xl font-semibold tracking-tight">Booking Confirmed</h1>
          <p className="mt-2 text-emerald-100">
            Your seats have been reserved. Here are your booking details.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5 rounded-xl bg-slate-50 p-3 text-center">
            <span className="text-xs font-medium text-slate-400">Booking Reference</span>
            <p className="font-mono text-lg font-bold text-slate-800 tracking-wider">
              {booking.id.slice(0, 10).toUpperCase()}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-400">Flight</span>
              <p className="font-semibold text-slate-800">{booking.flight.flightNumber}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Airline</span>
              <p className="font-semibold text-slate-800">{booking.flight.airline.name}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Route</span>
              <p className="font-semibold text-slate-800">
                {booking.flight.origin.iata} → {booking.flight.destination.iata}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Status</span>
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {booking.status}
              </span>
            </div>
          </div>

          <h3 className="mb-2 text-sm font-bold text-slate-700">Passengers & Seats</h3>
          <div className="space-y-2">
            {booking.passengers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    Age {p.age} · ID: {p.passportId}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Seat {p.seatLabel}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-medium text-slate-500">Total Paid</span>
            <span className="text-2xl font-extrabold text-slate-900">
              ${booking.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/flights"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Search More Flights
          </Link>
          <Link
            href="/dashboard/user"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
