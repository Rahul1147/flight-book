import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-12 pb-16 pt-4 sm:space-y-16 sm:pt-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-cyan-100 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Smarter Flight Operations
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Professional Flight Booking for Travelers and Operations Teams
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Search and book flights in seconds, monitor airport departures, and manage global platform operations from one refined experience.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/flights"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700"
            >
              Search Flights
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fast Search</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Route + Price Filters</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Find available flights quickly with airport, airline, date, and budget filters.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User Journey</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Seat-first Booking</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Intuitive seat map and passenger form flow for low-friction booking completion.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Airport Ops</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Departure Board</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Airport managers can update departure statuses in real time.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Insights</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Revenue + Roles</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Platform-wide analytics, user management, and operational visibility.</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-slate-100 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to fly smarter?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Start with flight search, then book seats and manage trips from your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/flights"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Explore Flights
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
