import { NextResponse } from 'next/server';
import { answerFlightAssistant } from '@/lib/flight-assistant';
import { getSessionAndRole } from '@/lib/route-auth';

type ChatBody = {
  message?: string;
  preferenceMode?: 'AUTO' | 'CHEAPEST' | 'FASTEST' | 'BALANCED';
};

export async function POST(request: Request) {
  const { session, role } = await getSessionAndRole(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'USER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();
    const mode = body.preferenceMode;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const override = mode && mode !== 'AUTO' ? mode : undefined;

    const result = await answerFlightAssistant(message, override);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/chat/flight-assistant]', error);
    return NextResponse.json({ error: 'Failed to process chat request.' }, { status: 500 });
  }
}
