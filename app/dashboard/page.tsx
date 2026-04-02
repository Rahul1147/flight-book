import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = user?.role;

  if (role === 'ADMIN') {
    redirect('/dashboard/admin');
  }

  if (role === 'AIRPORT_MANAGER') {
    redirect('/dashboard/airport');
  }

  if (role === 'USER' || !role) {
    redirect('/dashboard/user');
  }

  // Fallback in case of an unexpected role or no role
  return (
    <main className="grid min-h-[calc(100dvh-9rem)] place-items-center">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
        Redirecting to your dashboard...
      </div>
    </main>
  );
}
