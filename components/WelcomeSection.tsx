'use client';

interface WelcomeSectionProps {
  isAdmin: boolean;
}

export default function WelcomeSection({ isAdmin }: WelcomeSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Welcome</p>
      <h1 className="mb-6 mt-2 text-4xl font-semibold tracking-tight text-slate-900">Welcome to Flight Booker</h1>
      {isAdmin ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.location.href = '/dashboard/admin'}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Go to Admin Panel
          </button>
          <button
            onClick={() => window.location.href = '/flights'}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Explore User Flow
          </button>
        </div>
      ) : (
        <button
          onClick={() => window.location.href = '/flights'}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Search Flights
        </button>
      )}
    </div>
  );
}