'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type PreferenceMode = 'AUTO' | 'CHEAPEST' | 'FASTEST' | 'BALANCED';

type TopOption = {
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

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  topOptions?: TopOption[];
};

const preferenceStorageKey = 'flight-assistant-preference-mode';

const preferenceLabels: Record<PreferenceMode, string> = {
  AUTO: 'Auto',
  CHEAPEST: 'Always Cheapest',
  FASTEST: 'Always Fastest',
  BALANCED: 'Always Balanced',
};

export default function FlightChatAssistant() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [preferenceMode, setPreferenceMode] = useState<PreferenceMode>('AUTO');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Ask me things like: "best flight from JFK to LAX on 2026-04-16" or "shortest route from JFK to SIN on 2026-04-16".',
    },
  ]);

  useEffect(() => {
    const stored = window.localStorage.getItem(preferenceStorageKey);
    if (stored === 'AUTO' || stored === 'CHEAPEST' || stored === 'FASTEST' || stored === 'BALANCED') {
      setPreferenceMode(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(preferenceStorageKey, preferenceMode);
  }, [preferenceMode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setMessage('');

    try {
      const res = await fetch('/api/chat/flight-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, preferenceMode }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Chat request failed');
      }

      const topOptions = Array.isArray(payload?.data?.topOptions)
        ? (payload.data.topOptions as TopOption[])
        : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: payload.reply || 'No response generated.',
          topOptions,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I hit an error: ${(error as Error).message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Flight Assistant</h3>
        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">DB-backed</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['AUTO', 'CHEAPEST', 'FASTEST', 'BALANCED'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPreferenceMode(mode)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              preferenceMode === mode
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {preferenceLabels[mode]}
          </button>
        ))}
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`}>
            <div
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${item.role === 'user' ? 'ml-10 bg-slate-900 text-white' : 'mr-10 bg-white text-slate-800 border border-slate-200'}`}
            >
              {item.text}
            </div>

            {item.role === 'assistant' && item.topOptions && item.topOptions.length > 0 && (
              <div className="mr-10 mt-2 space-y-2">
                {item.topOptions.map((option, optionIndex) => (
                  <div key={`${index}-opt-${optionIndex}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-slate-900">{option.route}</p>
                    <p className="mt-1 text-slate-700">
                      ${option.totalPrice.toFixed(2)} · {option.totalDurationMins} mins · {option.stops} stop{option.stops === 1 ? '' : 's'}
                    </p>

                    <div className="mt-2 space-y-1">
                      {option.legs.map((leg) => (
                        <div key={leg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          <span>
                            {leg.flightNumber}: {leg.originIata} to {leg.destinationIata}
                          </span>
                          <span>
                            {new Date(leg.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(leg.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Link href={leg.bookingUrl} className="font-semibold text-sky-700 hover:text-sky-800">
                            Book leg
                          </Link>
                        </div>
                      ))}
                    </div>

                    {option.bookingUrl && (
                      <div className="mt-2">
                        <Link
                          href={option.bookingUrl}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Book this option
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask for best flight or shortest route..."
          className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </section>
  );
}
