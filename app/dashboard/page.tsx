import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    <main className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
      <p>Redirecting...</p>
    </main>
  );
}
