import { PrismaClient, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export const getSessionAndRole = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return { session: null, role: null };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return { session, role: user?.role ?? null };
};

export const isAdminRole = (role: UserRole | null) => role === 'ADMIN';