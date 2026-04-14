'use client';

import { type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';

type CancelTicketFormProps = {
  bookingId: string;
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Cancelling...' : 'Cancel Ticket'}
    </button>
  );
}

export default function CancelTicketForm({ bookingId, action }: CancelTicketFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const shouldCancel = window.confirm('Cancel this ticket? Seats will be released and refund will be marked pending.');
    if (!shouldCancel) {
      event.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="pt-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
    </form>
  );
}
