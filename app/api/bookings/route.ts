import { NextResponse } from 'next/server';
import { getSessionAndRole } from '@/lib/route-auth';
import { prisma } from '@/lib/prisma';

type PassengerInput = {
  name: string;
  passportId: string;
  age: number;
  seatLabel: string;
};

type BookingRequestBody = {
  flightId: string;
  seats: string[];           // e.g. ["3A", "12F"]
  passengers: PassengerInput[];
  totalPrice: number;
};

export async function POST(request: Request) {
  try {
    // ── Auth check ────────────────────────────────────────
    const { session, role } = await getSessionAndRole(request);
    if (!session || role !== 'USER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only users can create bookings.' },
        { status: 401 }
      );
    }

    const body: BookingRequestBody = await request.json();
    const { flightId, seats, passengers, totalPrice } = body;

    // ── Basic validation ─────────────────────────────────
    if (!flightId || !seats?.length || !passengers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: flightId, seats, passengers.' },
        { status: 400 }
      );
    }

    if (seats.length !== passengers.length) {
      return NextResponse.json(
        { error: 'Each selected seat must have exactly one passenger.' },
        { status: 400 }
      );
    }

    for (const p of passengers) {
      if (!p.name?.trim() || !p.passportId?.trim() || !p.age || p.age < 1) {
        return NextResponse.json(
          { error: 'All passenger fields (name, passportId, age) are required.' },
          { status: 400 }
        );
      }
    }

    // ── Verify flight exists & is bookable ───────────────
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: { id: true, status: true },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found.' },
        { status: 404 }
      );
    }

    if (flight.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot book a cancelled flight.' },
        { status: 400 }
      );
    }

    // ── Prisma Transaction: Inventory Lockdown ───────────
    // This ensures atomicity – if any seat is already taken the
    // entire booking is rolled back so no partial state remains.
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Check for conflicts: are any requested seats already booked?
      const conflicts = await tx.bookedSeat.findMany({
        where: {
          flightId,
          seatLabel: { in: seats },
        },
        select: { seatLabel: true },
      });

      if (conflicts.length > 0) {
        const taken = conflicts.map((c) => c.seatLabel).join(', ');
        throw new Error(`SEAT_CONFLICT:${taken}`);
      }

      // 2. Create the Booking record (PENDING)
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          flightId,
          status: 'PENDING',
          totalPrice,
        },
      });

      // 3. Create Passenger records
      await tx.passenger.createMany({
        data: passengers.map((p) => ({
          bookingId: newBooking.id,
          name: p.name.trim(),
          passportId: p.passportId.trim(),
          age: p.age,
          seatLabel: p.seatLabel,
        })),
      });

      // 4. Lock the seats (BookedSeat records)
      await tx.bookedSeat.createMany({
        data: seats.map((seatLabel) => ({
          flightId,
          bookingId: newBooking.id,
          seatLabel,
        })),
      });

      return newBooking;
    });

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        status: booking.status,
        message: 'Booking created successfully. Proceed to payment.',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';

    // Handle seat conflict gracefully
    if (message.startsWith('SEAT_CONFLICT:')) {
      const taken = message.replace('SEAT_CONFLICT:', '');
      return NextResponse.json(
        {
          error: `The following seats are no longer available: ${taken}. Please refresh and try again.`,
          conflictSeats: taken.split(', '),
        },
        { status: 409 }
      );
    }

    console.error('[POST /api/bookings]', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
