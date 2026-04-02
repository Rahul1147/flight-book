"use client";

import { signIn } from "@/lib/auth-client"; // Import from our client wrapper
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: "/redirect", // Redirect here after success
    });
    setLoading(false);
  };

  return (
    <div className="grid min-h-[calc(100dvh-9rem)] place-items-center py-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-100 blur-2xl" />

        <div className="relative text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Secure Access
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Continue with Google to access your flight dashboard and bookings.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-transparent bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </div>
            )}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            By continuing, you agree to secure authentication and role-based access policies.
          </p>
        </div>
      </div>
    </div>
  );
}