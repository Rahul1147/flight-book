'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatMap, { type SelectedSeat } from './SeatMap';
import PassengerForm, { type PassengerData } from './PassengerForm';

type FlightInfo = {
  id: string;
  flightNumber: string;
  basePrice: number;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  airlineName: string;
  airplaneModel: string;
  departureTime: string;
  arrivalTime: string;
  durationMins: number;
};

type BookingClientProps = {
  flight: FlightInfo;
  occupiedSeats: string[];
};

export default function BookingClient({
  flight,
  occupiedSeats,
}: BookingClientProps) {
  const router = useRouter();
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectionChange = (nextSeats: SelectedSeat[]) => {
    setSelectedSeats(nextSeats);
    setPassengers((prev) => {
      return nextSeats.map((seat) => {
        const existing = prev.find((p) => p.seatLabel === seat.label);
        return existing || { seatLabel: seat.label, name: '', passportId: '', age: '' };
      });
    });
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const isFormValid = () => {
    if (selectedSeats.length === 0) return false;
    return passengers.every(
      (p) =>
        p.name.trim().length > 0 &&
        p.passportId.trim().length > 0 &&
        Number(p.age) >= 1
    );
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please select at least one seat and fill all passenger details.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: flight.id,
          seats: selectedSeats.map((s) => s.label),
          passengers: passengers.map((p) => ({
            name: p.name,
            passportId: p.passportId,
            age: Number(p.age),
            seatLabel: p.seatLabel,
          })),
          totalPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success → redirect to confirmation
      router.push(`/bookings/${data.bookingId}/success`);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-2 py-2 sm:px-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Booking Flow</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Book Your Seats
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {flight.flightNumber} · {flight.airlineName} · {flight.airplaneModel}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Search
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium">From</span>
            <p className="font-bold text-slate-800">
              {flight.originIata}{' '}
              <span className="font-normal text-slate-500">{flight.originCity}</span>
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium">To</span>
            <p className="font-bold text-slate-800">
              {flight.destinationIata}{' '}
              <span className="font-normal text-slate-500">{flight.destinationCity}</span>
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium">Departure</span>
            <p className="font-bold text-slate-800">
              {new Date(flight.departureTime).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-xs text-slate-400 font-medium">Duration</span>
            <p className="font-bold text-slate-800">
              {formatDuration(flight.durationMins)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Select Your Seats
          </h2>
          <SeatMap
            basePrice={flight.basePrice}
            occupiedSeats={occupiedSeats}
            selectedSeats={selectedSeats}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PassengerForm
              selectedSeats={selectedSeats}
              passengers={passengers}
              onPassengersChange={setPassengers}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {selectedSeats.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Price</p>
                  <p className="text-3xl font-extrabold">
                    ${totalPrice.toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} ·{' '}
                    {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  className={`rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 ${
                    isSubmitting || !isFormValid()
                      ? 'cursor-not-allowed bg-slate-600 text-slate-400'
                      : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-xl active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    'Proceed to Payment →'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
