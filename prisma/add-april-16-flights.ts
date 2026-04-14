import { FlightStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PlannedFlight = {
  flightNumber: string;
  originIata: string;
  destinationIata: string;
  airlineCode: string;
  departureUtc: string;
  durationMins: number;
  basePrice: number;
};

const plannedFlights: PlannedFlight[] = [
  {
    flightNumber: 'GW1601',
    originIata: 'JFK',
    destinationIata: 'LAX',
    airlineCode: 'GW',
    departureUtc: '2026-04-16T06:30:00Z',
    durationMins: 375,
    basePrice: 429,
  },
  {
    flightNumber: 'SP1602',
    originIata: 'LAX',
    destinationIata: 'SEA',
    airlineCode: 'SP',
    departureUtc: '2026-04-16T09:45:00Z',
    durationMins: 165,
    basePrice: 219,
  },
  {
    flightNumber: 'TC1603',
    originIata: 'ORD',
    destinationIata: 'MIA',
    airlineCode: 'TC',
    departureUtc: '2026-04-16T11:20:00Z',
    durationMins: 185,
    basePrice: 259,
  },
  {
    flightNumber: 'NA1604',
    originIata: 'ATL',
    destinationIata: 'DFW',
    airlineCode: 'NA',
    departureUtc: '2026-04-16T13:10:00Z',
    durationMins: 145,
    basePrice: 189,
  },
  {
    flightNumber: 'AN1605',
    originIata: 'SFO',
    destinationIata: 'JFK',
    airlineCode: 'AN',
    departureUtc: '2026-04-16T15:05:00Z',
    durationMins: 335,
    basePrice: 409,
  },
  {
    flightNumber: 'GW1606',
    originIata: 'YYZ',
    destinationIata: 'LHR',
    airlineCode: 'GW',
    departureUtc: '2026-04-16T17:40:00Z',
    durationMins: 430,
    basePrice: 649,
  },
  {
    flightNumber: 'SP1607',
    originIata: 'DXB',
    destinationIata: 'SIN',
    airlineCode: 'SP',
    departureUtc: '2026-04-16T19:15:00Z',
    durationMins: 450,
    basePrice: 699,
  },
  {
    flightNumber: 'TC1608',
    originIata: 'FRA',
    destinationIata: 'CDG',
    airlineCode: 'TC',
    departureUtc: '2026-04-16T21:00:00Z',
    durationMins: 80,
    basePrice: 149,
  },
];

async function main() {
  const airports = await prisma.airport.findMany({
    select: { id: true, iata: true },
  });
  const airlines = await prisma.airline.findMany({
    select: { id: true, code: true },
  });
  const airplanes = await prisma.airplane.findMany({
    select: { id: true, airlineId: true },
  });

  const airportByIata = new Map(airports.map((a) => [a.iata, a.id]));
  const airlineByCode = new Map(airlines.map((a) => [a.code, a.id]));

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of plannedFlights) {
    const originId = airportByIata.get(item.originIata);
    const destinationId = airportByIata.get(item.destinationIata);
    const airlineId = airlineByCode.get(item.airlineCode);

    if (!originId || !destinationId || !airlineId) {
      throw new Error(
        `Missing lookup data for ${item.flightNumber} (${item.originIata}->${item.destinationIata}, ${item.airlineCode}).`,
      );
    }

    const airplane = airplanes.find((ap) => ap.airlineId === airlineId);
    if (!airplane) {
      throw new Error(`No airplane available for airline ${item.airlineCode}.`);
    }

    const exists = await prisma.flight.findFirst({
      where: { flightNumber: item.flightNumber },
      select: { id: true },
    });

    if (exists) {
      skippedCount += 1;
      continue;
    }

    const departure = new Date(item.departureUtc);
    const arrival = new Date(departure.getTime() + item.durationMins * 60_000);

    await prisma.flight.create({
      data: {
        flightNumber: item.flightNumber,
        originId,
        destinationId,
        airlineId,
        airplaneId: airplane.id,
        departureTime: departure,
        arrivalTime: arrival,
        durationMins: item.durationMins,
        basePrice: item.basePrice,
        status: FlightStatus.SCHEDULED,
      },
    });

    createdCount += 1;
  }

  console.log(`Added ${createdCount} April 16 flights. Skipped ${skippedCount} existing flights.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
