import { FlightStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type AirportLite = {
  id: string;
  iata: string;
  city: string;
  name: string;
};

type FlightNode = {
  id: string;
  flightNumber: string;
  originId: string;
  destinationId: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMins: number;
  basePrice: number;
  status: FlightStatus;
  origin: { iata: string; city: string };
  destination: { iata: string; city: string };
  airline: { code: string; name: string };
};

type AssistantPreference = 'CHEAPEST' | 'FASTEST' | 'BALANCED';

export type AssistantPreferenceMode = 'AUTO' | AssistantPreference;

type Itinerary = {
  legs: FlightNode[];
  totalPrice: number;
  totalDurationMins: number;
  stops: number;
};

type ParsedQuery = {
  intent: 'BEST_FLIGHT' | 'SHORTEST_ROUTE';
  sourceAirport: AirportLite | null;
  destinationAirport: AirportLite | null;
  date: Date;
  preference: AssistantPreference;
};

export type AssistantTopOption = {
  route: string;
  totalPrice: number;
  totalDurationMins: number;
  stops: number;
  bookingUrl: string | null;
  legs: Array<{
    id: string;
    flightNumber: string;
    originIata: string;
    destinationIata: string;
    departureTime: string;
    arrivalTime: string;
    durationMins: number;
    basePrice: number;
    bookingUrl: string;
  }>;
};

export type FlightAssistantAnswer = {
  reply: string;
  data?: {
    intent: ParsedQuery['intent'];
    preference: AssistantPreference;
    date: string;
    source: string;
    destination: string;
    topOptions: AssistantTopOption[];
  };
};

const monthMap: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const normalize = (value: string) => value.toLowerCase().trim();

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

const parseDateFromPrompt = (prompt: string) => {
  const lower = normalize(prompt);

  const isoMatch = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const candidate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    if (!Number.isNaN(candidate.getTime())) return candidate;
  }

  const namedMatch = lower.match(/(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(\d{4}))?/);
  if (namedMatch) {
    const day = Number(namedMatch[1]);
    const month = monthMap[namedMatch[2]];
    const year = namedMatch[3] ? Number(namedMatch[3]) : new Date().getUTCFullYear();
    const candidate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    if (!Number.isNaN(candidate.getTime())) return candidate;
  }

  return startOfUtcDay(new Date());
};

const parsePreference = (prompt: string): AssistantPreference => {
  const lower = normalize(prompt);
  if (/(cheap|cheapest|lowest|budget)/.test(lower)) return 'CHEAPEST';
  if (/(fast|fastest|shortest)/.test(lower)) return 'FASTEST';
  return 'BALANCED';
};

const parseIntent = (prompt: string): ParsedQuery['intent'] => {
  const lower = normalize(prompt);
  if (/(shortest route|shortest path|fastest route|multi[-\s]?stop)/.test(lower)) return 'SHORTEST_ROUTE';
  return 'BEST_FLIGHT';
};

const resolveAirportByToken = (token: string, airports: AirportLite[]) => {
  const value = normalize(token).replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!value) return null;

  if (value.length === 3) {
    const byIata = airports.find((airport) => normalize(airport.iata) === value);
    if (byIata) return byIata;
  }

  const byCity = airports.find((airport) => normalize(airport.city) === value);
  if (byCity) return byCity;

  const byIataContains = airports.find((airport) => normalize(airport.iata).includes(value));
  if (byIataContains) return byIataContains;

  const byCityContains = airports.find((airport) => normalize(airport.city).includes(value));
  if (byCityContains) return byCityContains;

  const byNameContains = airports.find((airport) => normalize(airport.name).includes(value));
  if (byNameContains) return byNameContains;

  return null;
};

const parseAirportsFromPrompt = (prompt: string, airports: AirportLite[]) => {
  const lower = normalize(prompt);

  const fromToMatch = lower.match(/from\s+([a-z\s]{2,30}?)\s+to\s+([a-z\s]{2,30}?)(?:\s+on\b|\s+for\b|\?|\.|,|$)/);
  if (fromToMatch) {
    const sourceAirport = resolveAirportByToken(fromToMatch[1], airports);
    const destinationAirport = resolveAirportByToken(fromToMatch[2], airports);
    return { sourceAirport, destinationAirport };
  }

  const mentioned = airports.filter((airport) => {
    const iata = normalize(airport.iata);
    const city = normalize(airport.city);
    return new RegExp(`\\b${iata}\\b`).test(lower) || new RegExp(`\\b${city}\\b`).test(lower);
  });

  return {
    sourceAirport: mentioned[0] ?? null,
    destinationAirport: mentioned[1] ?? null,
  };
};

const minutesBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60000);

const scoreItinerary = (itinerary: Itinerary, preference: AssistantPreference) => {
  const normalizedPrice = itinerary.totalPrice / 100;
  const normalizedDuration = itinerary.totalDurationMins / 60;
  const stopPenalty = itinerary.stops * 2;

  if (preference === 'CHEAPEST') return normalizedPrice * 1.8 + normalizedDuration * 0.6 + stopPenalty;
  if (preference === 'FASTEST') return normalizedDuration * 1.8 + normalizedPrice * 0.5 + stopPenalty;
  return normalizedPrice * 1.0 + normalizedDuration * 1.0 + stopPenalty;
};

const enumerateItineraries = (
  flights: FlightNode[],
  sourceAirportId: string,
  destinationAirportId: string,
  dayStart: Date,
) => {
  const byOrigin = new Map<string, FlightNode[]>();
  for (const flight of flights) {
    const list = byOrigin.get(flight.originId) ?? [];
    list.push(flight);
    byOrigin.set(flight.originId, list);
  }

  for (const [, list] of byOrigin) {
    list.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  }

  const minLayoverMins = 45;
  const maxLayoverMins = 8 * 60;
  const maxLegs = 3;
  const itineraries: Itinerary[] = [];

  const walk = (currentAirportId: string, path: FlightNode[], visited: Set<string>) => {
    if (path.length > maxLegs) return;

    if (currentAirportId === destinationAirportId && path.length > 0) {
      const first = path[0];
      const last = path[path.length - 1];
      const totalPrice = path.reduce((sum, leg) => sum + leg.basePrice, 0);
      const totalDurationMins = minutesBetween(first.departureTime, last.arrivalTime);
      itineraries.push({
        legs: [...path],
        totalPrice,
        totalDurationMins,
        stops: path.length - 1,
      });
      return;
    }

    const outgoing = byOrigin.get(currentAirportId) ?? [];

    for (const flight of outgoing) {
      if (visited.has(flight.destinationId)) continue;

      if (path.length === 0) {
        if (flight.departureTime < dayStart) continue;
      } else {
        const prev = path[path.length - 1];
        const layover = minutesBetween(prev.arrivalTime, flight.departureTime);
        if (layover < minLayoverMins || layover > maxLayoverMins) continue;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(flight.destinationId);
      walk(flight.destinationId, [...path, flight], nextVisited);
    }
  };

  walk(sourceAirportId, [], new Set([sourceAirportId]));
  return itineraries;
};

const formatItinerary = (itinerary: Itinerary) => {
  const route = [itinerary.legs[0]?.origin.iata, ...itinerary.legs.map((leg) => leg.destination.iata)]
    .filter(Boolean)
    .join(' -> ');
  const flights = itinerary.legs.map((leg) => leg.flightNumber).join(', ');

  return `${route} | ${flights} | $${itinerary.totalPrice.toFixed(2)} | ${itinerary.totalDurationMins} mins | ${itinerary.stops} stop${itinerary.stops === 1 ? '' : 's'}`;
};

const fetchFlightsForWindow = async (dayStart: Date) => {
  const dayEnd = new Date(dayStart.getTime() + 2 * 24 * 60 * 60 * 1000);

  return prisma.flight.findMany({
    where: {
      status: { not: 'CANCELLED' },
      departureTime: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    include: {
      origin: { select: { iata: true, city: true } },
      destination: { select: { iata: true, city: true } },
      airline: { select: { code: true, name: true } },
    },
    orderBy: [{ departureTime: 'asc' }],
    take: 400,
  });
};

const getNearestDirectFlightDates = async (
  sourceAirportId: string,
  destinationAirportId: string,
  fromDate: Date,
) => {
  const start = startOfUtcDay(fromDate);
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const direct = await prisma.flight.findMany({
    where: {
      status: { not: 'CANCELLED' },
      originId: sourceAirportId,
      destinationId: destinationAirportId,
      departureTime: {
        gte: start,
        lt: end,
      },
    },
    select: {
      departureTime: true,
      flightNumber: true,
      basePrice: true,
    },
    orderBy: [{ departureTime: 'asc' }],
    take: 5,
  });

  return direct;
};

const getAvailableDestinationsFromSource = async (sourceAirportId: string, date: Date) => {
  const dayStart = startOfUtcDay(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const flights = await prisma.flight.findMany({
    where: {
      status: { not: 'CANCELLED' },
      originId: sourceAirportId,
      departureTime: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    select: {
      destination: {
        select: {
          iata: true,
        },
      },
    },
    orderBy: [{ destination: { iata: 'asc' } }],
    take: 40,
  });

  const uniqueIatas = Array.from(new Set(flights.map((item) => item.destination.iata)));
  return uniqueIatas.slice(0, 8);
};

export async function answerFlightAssistant(
  prompt: string,
  preferenceOverride?: AssistantPreference,
) {
  const airports = await prisma.airport.findMany({
    select: { id: true, iata: true, city: true, name: true },
    orderBy: [{ city: 'asc' }],
  });

  const intent = parseIntent(prompt);
  const date = parseDateFromPrompt(prompt);
  const preference = preferenceOverride ?? parsePreference(prompt);
  const { sourceAirport, destinationAirport } = parseAirportsFromPrompt(prompt, airports);

  const parsed: ParsedQuery = {
    intent,
    sourceAirport,
    destinationAirport,
    date,
    preference,
  };

  if (!parsed.sourceAirport || !parsed.destinationAirport) {
    return {
      reply:
        'I can help with recommendations. Please specify both source and destination, for example: "best flight from JFK to LAX on 2026-04-16".',
    };
  }

  if (parsed.sourceAirport.id === parsed.destinationAirport.id) {
    return {
      reply: 'Source and destination cannot be the same airport.',
    };
  }

  const flights = await fetchFlightsForWindow(parsed.date);

  const itineraries = enumerateItineraries(
    flights,
    parsed.sourceAirport.id,
    parsed.destinationAirport.id,
    parsed.date,
  );

  if (itineraries.length === 0) {
    const nearestDirect = await getNearestDirectFlightDates(
      parsed.sourceAirport.id,
      parsed.destinationAirport.id,
      parsed.date,
    );

    if (nearestDirect.length > 0) {
      const suggestions = nearestDirect
        .map(
          (flight) =>
            `${flight.departureTime.toISOString().slice(0, 10)} (${flight.flightNumber}, $${flight.basePrice.toFixed(2)})`,
        )
        .join(', ');

      return {
        reply: [
          `No available routes found from ${parsed.sourceAirport.iata} to ${parsed.destinationAirport.iata} on ${parsed.date.toISOString().slice(0, 10)}.`,
          `Closest available direct options are on: ${suggestions}.`,
          `Try asking: "best flight from ${parsed.sourceAirport.iata} to ${parsed.destinationAirport.iata} on ${nearestDirect[0].departureTime.toISOString().slice(0, 10)}".`,
        ].join('\n'),
      } satisfies FlightAssistantAnswer;
    }

    const availableDestinations = await getAvailableDestinationsFromSource(
      parsed.sourceAirport.id,
      parsed.date,
    );

    if (availableDestinations.length > 0) {
      return {
        reply: [
          `No available routes found from ${parsed.sourceAirport.iata} to ${parsed.destinationAirport.iata} on ${parsed.date.toISOString().slice(0, 10)}.`,
          `Available destinations from ${parsed.sourceAirport.iata} on that date: ${availableDestinations.join(', ')}.`,
          `You can also try a nearby date in your question.`,
        ].join('\n'),
      } satisfies FlightAssistantAnswer;
    }

    return {
      reply: `No available routes found from ${parsed.sourceAirport.iata} to ${parsed.destinationAirport.iata} around ${parsed.date.toISOString().slice(0, 10)}.`,
    } satisfies FlightAssistantAnswer;
  }

  const ranked = [...itineraries].sort((a, b) => {
    if (parsed.intent === 'SHORTEST_ROUTE') {
      return a.totalDurationMins - b.totalDurationMins || a.totalPrice - b.totalPrice;
    }

    const scoreA = scoreItinerary(a, parsed.preference);
    const scoreB = scoreItinerary(b, parsed.preference);
    return scoreA - scoreB;
  });

  const best = ranked[0];
  const alternatives = ranked.slice(1, 3);

  const reason =
    parsed.intent === 'SHORTEST_ROUTE'
      ? 'shortest total travel time'
      : parsed.preference === 'CHEAPEST'
        ? 'lowest weighted cost'
        : parsed.preference === 'FASTEST'
          ? 'lowest weighted duration'
          : 'best balance of price, duration, and stops';

  const lines = [
    `Best option (${reason}) for ${parsed.sourceAirport.iata} -> ${parsed.destinationAirport.iata} on ${parsed.date.toISOString().slice(0, 10)}:`,
    formatItinerary(best),
  ];

  if (alternatives.length > 0) {
    lines.push('Alternatives:');
    for (const option of alternatives) {
      lines.push(formatItinerary(option));
    }
  }

  return {
    reply: lines.join('\n'),
    data: {
      intent: parsed.intent,
      preference: parsed.preference,
      date: parsed.date.toISOString().slice(0, 10),
      source: parsed.sourceAirport.iata,
      destination: parsed.destinationAirport.iata,
      topOptions: ranked.slice(0, 3).map((item) => {
        const route = [item.legs[0]?.origin.iata, ...item.legs.map((leg) => leg.destination.iata)]
          .filter(Boolean)
          .join(' -> ');

        return {
          route,
          totalPrice: Number(item.totalPrice.toFixed(2)),
          totalDurationMins: item.totalDurationMins,
          stops: item.stops,
          bookingUrl: item.legs.length === 1 ? `/bookings/${item.legs[0].id}` : null,
          legs: item.legs.map((leg) => ({
            id: leg.id,
            flightNumber: leg.flightNumber,
            originIata: leg.origin.iata,
            destinationIata: leg.destination.iata,
            departureTime: leg.departureTime.toISOString(),
            arrivalTime: leg.arrivalTime.toISOString(),
            durationMins: leg.durationMins,
            basePrice: Number(leg.basePrice.toFixed(2)),
            bookingUrl: `/bookings/${leg.id}`,
          })),
        };
      }),
    },
  } satisfies FlightAssistantAnswer;
}
