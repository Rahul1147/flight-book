import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import FlightHeroSearch from '@/components/FlightHeroSearch';
import FlightResults from '@/components/FlightResults';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getFlightSearchMeta = unstable_cache(
  async () =>
    prisma.$transaction([
      prisma.airport.findMany({
        orderBy: [{ city: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          iata: true,
          city: true,
          name: true,
          country: true,
        },
      }),
      prisma.airline.findMany({
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
    ]),
  ['flight-search-meta'],
  { revalidate: 300 },
);

type FlightsPageProps = {
  searchParams: Promise<{
    sourceAirportId?: string;
    destinationAirportId?: string;
    date?: string;
    airlineId?: string;
    minPrice?: string;
    maxPrice?: string;
    priceRange?: string;
  }>;
};

const parseDateRange = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    Number.isNaN(start.getTime()) ||
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    start.getUTCDate() !== day
  ) {
    return null;
  }

  const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  return { start, end };
};

const parsePriceBounds = (params: {
  minPrice?: string;
  maxPrice?: string;
  priceRange?: string;
}) => {
  let minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  let maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  if (params.priceRange) {
    const [minRaw = '', maxRaw = ''] = params.priceRange.split(/[-:,]/).map((part) => part.trim());
    if (minPrice === undefined && minRaw) minPrice = Number(minRaw);
    if (maxPrice === undefined && maxRaw) maxPrice = Number(maxRaw);
  }

  if (minPrice !== undefined && Number.isNaN(minPrice)) minPrice = undefined;
  if (maxPrice !== undefined && Number.isNaN(maxPrice)) maxPrice = undefined;
  if (minPrice !== undefined && minPrice < 0) minPrice = 0;
  if (maxPrice !== undefined && maxPrice < 0) maxPrice = undefined;

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return { minPrice, maxPrice };
};

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
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

  const params = await searchParams;
  const sourceAirportId = params.sourceAirportId?.trim() || '';
  const destinationAirportId = params.destinationAirportId?.trim() || '';
  const airlineId = params.airlineId?.trim() || '';
  const date = params.date?.trim() || '';
  const dateRange = date ? parseDateRange(date) : null;
  const { minPrice, maxPrice } = parsePriceBounds(params);

  const where: Prisma.FlightWhereInput = {};

  if (sourceAirportId) where.originId = sourceAirportId;
  if (destinationAirportId) where.destinationId = destinationAirportId;
  if (airlineId) where.airlineId = airlineId;

  if (dateRange) {
    where.departureTime = { gte: dateRange.start, lt: dateRange.end };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  const hasFilters = Boolean(
    sourceAirportId ||
      destinationAirportId ||
      airlineId ||
      date ||
      minPrice !== undefined ||
      maxPrice !== undefined,
  );

  const [searchMeta, flights] = await Promise.all([
    getFlightSearchMeta(),
    prisma.flight.findMany({
      where,
      include: {
        origin: true,
        destination: true,
        airline: true,
        airplane: true,
      },
      orderBy: [{ departureTime: 'asc' }],
      take: 100,
    }),
  ]);

  const [airports, airlines] = searchMeta;

  return (
    <main className="min-h-[calc(100dvh-9rem)] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <FlightHeroSearch
          airports={airports}
          airlines={airlines}
          values={{
            sourceAirportId,
            destinationAirportId,
            date,
            airlineId,
            minPrice: minPrice?.toString() ?? '',
            maxPrice: maxPrice?.toString() ?? '',
          }}
        />

        {date && !dateRange && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Date must be a valid YYYY-MM-DD value.
          </p>
        )}

        <FlightResults flights={flights} hasFilters={hasFilters} />
      </div>
    </main>
  );
}
