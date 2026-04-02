import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const adminProtectedPrefixes = ['/dashboard/admin', '/api/admin'];
const userProtectedPrefixes = ['/dashboard/user', '/flights', '/bookings'];

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const getRole = async (request: NextRequest) => {
  const roleUrl = new URL('/api/auth/role', request.url);
  const response = await fetch(roleUrl, {
    method: 'GET',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Unable to resolve user role');
  }

  const data = (await response.json()) as { role?: string | null };
  return data.role ?? null;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = startsWithAny(pathname, adminProtectedPrefixes);
  const isUserPath = startsWithAny(pathname, userProtectedPrefixes);

  if (!isAdminPath && !isUserPath) {
    return NextResponse.next();
  }

  let role: string | null = null;
  try {
    role = await getRole(request);
  } catch {
    return NextResponse.next();
  }

  if (!role) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  const isAdmin = role === 'ADMIN';
  const isAirportManager = role === 'AIRPORT_MANAGER';

  if (isAdminPath && !isAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userUrl = request.nextUrl.clone();
    userUrl.pathname = isAirportManager ? '/dashboard/airport' : '/dashboard/user';
    userUrl.search = '';
    return NextResponse.redirect(userUrl);
  }

  if (isUserPath && isAirportManager) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/flights/:path*', '/bookings/:path*', '/api/admin/:path*'],
};