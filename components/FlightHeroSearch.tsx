'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type AirportOption = {
  id: string;
  iata: string;
  city: string;
  country: string;
};

type AirlineOption = {
  id: string;
  name: string;
  code: string;
};

type FlightHeroSearchProps = {
  airports: AirportOption[];
  airlines: AirlineOption[];
  values: {
    sourceAirportId: string;
    destinationAirportId: string;
    date: string;
    airlineId: string;
    minPrice: string;
    maxPrice: string;
  };
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function FlightHeroSearch({ airports, airlines, values }: FlightHeroSearchProps) {
  const airportLabels = useMemo(
    () =>
      airports.map((airport) => ({
        id: airport.id,
        label: `${airport.iata} - ${airport.city}, ${airport.country}`,
      })),
    [airports],
  );

  const airlineLabels = useMemo(
    () =>
      airlines.map((airline) => ({
        id: airline.id,
        label: `${airline.name} (${airline.code})`,
      })),
    [airlines],
  );

  const sourceLabel =
    airportLabels.find((item) => item.id === values.sourceAirportId)?.label ?? '';
  const destinationLabel =
    airportLabels.find((item) => item.id === values.destinationAirportId)?.label ?? '';
  const airlineLabel =
    airlineLabels.find((item) => item.id === values.airlineId)?.label ?? '';

  const [sourceQuery, setSourceQuery] = useState(sourceLabel);
  const [destinationQuery, setDestinationQuery] = useState(destinationLabel);
  const [airlineQuery, setAirlineQuery] = useState(airlineLabel);

  const sourceId =
    airportLabels.find((item) => normalize(item.label) === normalize(sourceQuery))?.id ?? '';
  const destinationId =
    airportLabels.find((item) => normalize(item.label) === normalize(destinationQuery))?.id ?? '';
  const selectedAirlineId =
    airlineLabels.find((item) => normalize(item.label) === normalize(airlineQuery))?.id ?? '';

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-white via-sky-50/70 to-cyan-50/70 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Discover</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Book The Right Flight Faster
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Autocomplete airports and airlines, filter by date and budget, then find your next trip in seconds.
          </p>
        </div>
        <Link
          href="/dashboard/user"
          className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          Back to Dashboard
        </Link>
      </div>

      <form method="GET" action="/flights" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <input type="hidden" name="sourceAirportId" value={sourceId} />
        <input type="hidden" name="destinationAirportId" value={destinationId} />
        <input type="hidden" name="airlineId" value={selectedAirlineId} />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Source Airport
          <input
            list="source-airport-options"
            value={sourceQuery}
            onChange={(event) => setSourceQuery(event.target.value)}
            placeholder="Start typing airport"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
          />
          <datalist id="source-airport-options">
            {airportLabels.map((airport) => (
              <option key={airport.id} value={airport.label} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Destination Airport
          <input
            list="destination-airport-options"
            value={destinationQuery}
            onChange={(event) => setDestinationQuery(event.target.value)}
            placeholder="Start typing airport"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
          />
          <datalist id="destination-airport-options">
            {airportLabels.map((airport) => (
              <option key={airport.id} value={airport.label} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Date
          <input
            type="date"
            name="date"
            defaultValue={values.date}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Airline
          <input
            list="airline-options"
            value={airlineQuery}
            onChange={(event) => setAirlineQuery(event.target.value)}
            placeholder="Any airline"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
          />
          <datalist id="airline-options">
            {airlineLabels.map((airline) => (
              <option key={airline.id} value={airline.label} />
            ))}
          </datalist>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Min Price
            <input
              type="number"
              name="minPrice"
              min={0}
              step="1"
              defaultValue={values.minPrice}
              placeholder="0"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Max Price
            <input
              type="number"
              name="maxPrice"
              min={0}
              step="1"
              defaultValue={values.maxPrice}
              placeholder="1500"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-500"
            />
          </label>
        </div>

        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700"
          >
            Search Flights
          </button>
          <Link
            href="/flights"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}