'use client';

// ─── Config ──────────────────────────────────────────────
const TOTAL_ROWS = 30;
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BUSINESS_ROWS = 5; // Rows 1-5 are Business Class
const BUSINESS_MULTIPLIER = 2.5;

export type SelectedSeat = {
  label: string; // e.g. "3A"
  row: number;
  col: string;
  price: number;
  class: 'Business' | 'Economy';
};

type SeatMapProps = {
  basePrice: number;
  occupiedSeats: string[]; // Labels like ["1A", "3C", "12F"]
  selectedSeats: SelectedSeat[];
  onSelectionChange: (seats: SelectedSeat[]) => void;
  maxSeats?: number;
};

export default function SeatMap({
  basePrice,
  occupiedSeats,
  selectedSeats,
  onSelectionChange,
  maxSeats = 9,
}: SeatMapProps) {
  const occupiedSet = new Set(occupiedSeats);

  const getSeatPrice = (row: number) => {
    return row <= BUSINESS_ROWS
      ? Math.round(basePrice * BUSINESS_MULTIPLIER * 100) / 100
      : Math.round(basePrice * 100) / 100;
  };

  const getSeatClass = (row: number): 'Business' | 'Economy' => {
    return row <= BUSINESS_ROWS ? 'Business' : 'Economy';
  };

  const isSelected = (label: string) =>
    selectedSeats.some((s) => s.label === label);

  const handleSeatClick = (row: number, col: string) => {
    const label = `${row}${col}`;
    if (occupiedSet.has(label)) return;

    const alreadySelected = selectedSeats.find((s) => s.label === label);
    if (alreadySelected) {
      onSelectionChange(selectedSeats.filter((s) => s.label !== label));
    } else {
      if (selectedSeats.length >= maxSeats) return;
      onSelectionChange([
        ...selectedSeats,
        {
          label,
          row,
          col,
          price: getSeatPrice(row),
          class: getSeatClass(row),
        },
      ]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="w-full">
      {/* ─── Legend ─── */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border border-violet-300 bg-violet-100" />
          Business
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border border-sky-300 bg-sky-100" />
          Economy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded border-2 border-emerald-500 bg-emerald-400" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-4 rounded bg-slate-300" />
          Occupied
        </span>
      </div>

      {/* ─── Pricing Banner ─── */}
      <div className="mb-5 flex justify-center gap-6 text-xs text-slate-600">
        <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
          Business: ${getSeatPrice(1).toFixed(0)}
        </span>
        <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
          Economy: ${getSeatPrice(BUSINESS_ROWS + 1).toFixed(0)}
        </span>
      </div>

      {/* ─── Aircraft Body ─── */}
      <div className="mx-auto max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 shadow-inner"
           style={{ maxHeight: '420px' }}>
        {/* Column headers */}
        <div className="mb-2 flex items-center justify-center gap-0.5">
          <span className="w-8" />
          {COLUMNS.map((col) => (
            <span
              key={col}
              className={`flex h-6 w-8 items-center justify-center text-[11px] font-bold text-slate-400 ${
                col === 'D' ? 'ml-5' : ''
              }`}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Seat rows */}
        {Array.from({ length: TOTAL_ROWS }, (_, i) => {
          const row = i + 1;
          const isBusiness = row <= BUSINESS_ROWS;
          return (
            <div key={row} className="flex items-center justify-center gap-0.5 mb-0.5">
              {/* Row number */}
              <span className="w-8 text-right pr-1 text-[11px] font-semibold text-slate-400">
                {row}
              </span>
              {COLUMNS.map((col) => {
                const label = `${row}${col}`;
                const occupied = occupiedSet.has(label);
                const selected = isSelected(label);

                let seatClasses =
                  'h-7 w-8 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer flex items-center justify-center ';

                if (occupied) {
                  seatClasses +=
                    'bg-slate-300 text-slate-400 cursor-not-allowed opacity-60';
                } else if (selected) {
                  seatClasses +=
                    'bg-emerald-400 border-2 border-emerald-600 text-white shadow-md scale-105';
                } else if (isBusiness) {
                  seatClasses +=
                    'bg-violet-100 border border-violet-300 text-violet-700 hover:bg-violet-200 hover:border-violet-400 hover:scale-105';
                } else {
                  seatClasses +=
                    'bg-sky-100 border border-sky-300 text-sky-700 hover:bg-sky-200 hover:border-sky-400 hover:scale-105';
                }

                // Aisle gap
                if (col === 'D') {
                  seatClasses += ' ml-5';
                }

                return (
                  <button
                    key={label}
                    disabled={occupied}
                    onClick={() => handleSeatClick(row, col)}
                    className={seatClasses}
                    title={
                      occupied
                        ? `${label} – Occupied`
                        : `${label} – $${getSeatPrice(row)} (${getSeatClass(row)})`
                    }
                  >
                    {occupied ? '✕' : col}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Divider between business & economy */}
        <div className="relative my-0">
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300"
            style={{ top: `${BUSINESS_ROWS * 31 + 28}px` }}
          />
        </div>
      </div>

      {/* ─── Selection Summary ─── */}
      {selectedSeats.length > 0 && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h4 className="mb-2 text-sm font-bold text-emerald-800">
            Selected Seats ({selectedSeats.length})
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {selectedSeats.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-emerald-700 shadow-sm border border-emerald-200"
              >
                {s.label}
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{s.class}</span>
                <span className="text-slate-400">·</span>
                ${s.price.toFixed(0)}
                <button
                  onClick={() =>
                    onSelectionChange(
                      selectedSeats.filter((x) => x.label !== s.label)
                    )
                  }
                  className="ml-0.5 text-red-400 hover:text-red-600"
                  title="Remove"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 text-right text-base font-bold text-emerald-900">
            Total: ${totalPrice.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
