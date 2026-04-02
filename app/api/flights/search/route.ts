import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const buildDateRange = (dateParam: string) => {
  const match = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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

const parsePriceRange = (searchParams: URLSearchParams) => {
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const compactRange = searchParams.get('priceRange');

  let minPrice = minPriceParam ? Number(minPriceParam) : undefined;
  let maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;

  if (compactRange) {
    const [minRaw = '', maxRaw = ''] = compactRange.split(/[-:,]/).map((part) => part.trim());
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const sourceAirportId = searchParams.get('sourceAirportId')?.trim() || undefined;
  const destinationAirportId = searchParams.get('destinationAirportId')?.trim() || undefined;
  const airlineId = searchParams.get('airlineId')?.trim() || undefined;
  const dateParam = searchParams.get('date')?.trim();

  const where: Prisma.FlightWhereInput = {};

  if (sourceAirportId) where.originId = sourceAirportId;
  if (destinationAirportId) where.destinationId = destinationAirportId;
  if (airlineId) where.airlineId = airlineId;

  if (dateParam) {
    const range = buildDateRange(dateParam);
    if (!range) {
      return NextResponse.json(
        { error: 'Invalid date format. Use a real YYYY-MM-DD value.' },
        { status: 400 },
      );
    }

    where.departureTime = {
      gte: range.start,
      lt: range.end,
    };
  }

  const { minPrice, maxPrice } = parsePriceRange(searchParams);
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  const flights = await prisma.flight.findMany({
    where,
    include: {
      origin: true,
      destination: true,
      airline: true,
      airplane: true,
    },
    orderBy: [{ departureTime: 'asc' }],
    take: 100,
  });

  return NextResponse.json(flights);
}
