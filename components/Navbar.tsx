"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/65 bg-white/88 backdrop-blur-lg supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={session ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white">
              FB
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Flight Booker
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/flights"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Flights
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:block">
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}