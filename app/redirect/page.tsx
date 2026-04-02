import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RedirectPageProps = {
  searchParams: Promise<{
    target?: 'admin' | 'user';
    from?: string;
  }>;
};

export default async function RedirectPage({ searchParams }: RedirectPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const target = params.target;
  const from = params.from;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = user?.role || 'USER';
  const isAdmin = role === 'ADMIN';
  const isAirportManager = role === 'AIRPORT_MANAGER';

  if (target === 'admin') {
    if (isAdmin) {
      if (from?.startsWith('/dashboard/admin')) redirect(from);
      if (from?.startsWith('/api/admin')) redirect('/dashboard/admin');
      redirect('/dashboard/admin');
    }
    if (isAirportManager) {
      redirect('/dashboard/airport');
    }
    redirect('/dashboard/user');
  }

  if (target === 'user') {
    if (isAdmin) {
      redirect('/dashboard/admin');
    }
    if (isAirportManager) {
      redirect('/dashboard/airport');
    }
    if (from?.startsWith('/dashboard/user') || from?.startsWith('/flights') || from?.startsWith('/bookings')) {
      redirect(from);
    }
    redirect('/dashboard/user');
  }

  if (isAdmin) {
    redirect('/dashboard/admin');
  }

  if (isAirportManager) {
    redirect('/dashboard/airport');
  }

  redirect('/dashboard/user');
}