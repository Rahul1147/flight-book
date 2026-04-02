import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BookingClient from '@/components/BookingClient';
import { prisma } from '@/lib/prisma';

type BookingDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  // ── Auth guard ──────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'USER') {
    redirect('/dashboard');
  }

  // ── Load flight data ───────────────────────────────────
  const { id } = await params;

  const [flight, bookedSeats] = await Promise.all([
    prisma.flight.findUnique({
      where: { id },
      include: {
        origin: true,
        destination: true,
        airline: true,
        airplane: true,
      },
    }),
    prisma.bookedSeat.findMany({
      where: { flightId: id },
      select: { seatLabel: true },
    }),
  ]);

  if (!flight) {
    notFound();
  }

  // ── Load occupied seats for this flight ────────────────
  const occupiedSeats = bookedSeats.map((s) => s.seatLabel);

  // ── Serialize flight info for client component ─────────
  const flightInfo = {
    id: flight.id,
    flightNumber: flight.flightNumber,
    basePrice: flight.basePrice,
    originIata: flight.origin.iata,
    originCity: flight.origin.city,
    destinationIata: flight.destination.iata,
    destinationCity: flight.destination.city,
    airlineName: flight.airline.name,
    airplaneModel: flight.airplane.model,
    departureTime: flight.departureTime.toISOString(),
    arrivalTime: flight.arrivalTime.toISOString(),
    durationMins: flight.durationMins,
  };

  return (
    <main>
      <BookingClient flight={flightInfo} occupiedSeats={occupiedSeats} />
    </main>
  );
}
