'use client';

import type { SelectedSeat } from './SeatMap';

export type PassengerData = {
  seatLabel: string;
  name: string;
  passportId: string;
  age: string;
};

type PassengerFormProps = {
  selectedSeats: SelectedSeat[];
  passengers: PassengerData[];
  onPassengersChange: (passengers: PassengerData[]) => void;
};

export default function PassengerForm({
  selectedSeats,
  passengers,
  onPassengersChange,
}: PassengerFormProps) {
  const updateField = (
    index: number,
    field: keyof PassengerData,
    value: string
  ) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onPassengersChange(updated);
  };

  if (selectedSeats.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center text-sm text-amber-700">
        <span className="text-lg">💺</span>
        <p className="mt-1 font-medium">Select seats from the map above to add passengers</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold tracking-tight text-slate-800">
        Passenger Details{' '}
        <span className="text-sm font-normal text-slate-500">
          ({selectedSeats.length} passenger{selectedSeats.length !== 1 ? 's' : ''})
        </span>
      </h3>

      {selectedSeats.map((seat, idx) => {
        const p = passengers[idx] || {
          seatLabel: seat.label,
          name: '',
          passportId: '',
          age: '',
        };
        return (
          <div
            key={seat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  seat.class === 'Business'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                Seat {seat.label}
              </span>
              <span className="text-xs text-slate-400">
                {seat.class} · ${seat.price.toFixed(0)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={p.name}
                  placeholder="John Doe"
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Passport / ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={p.passportId}
                  placeholder="AB1234567"
                  onChange={(e) =>
                    updateField(idx, 'passportId', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Age <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={p.age}
                  placeholder="28"
                  min={1}
                  max={120}
                  onChange={(e) => updateField(idx, 'age', e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
