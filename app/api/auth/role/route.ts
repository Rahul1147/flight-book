import { NextResponse } from 'next/server';
import { getSessionAndRole } from '@/lib/route-auth';

export async function GET(request: Request) {
  const { session, role } = await getSessionAndRole(request);

  if (!session) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  return NextResponse.json({ role: role ?? 'USER' });
}