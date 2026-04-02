import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SessionAndRole = {
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  role: UserRole | null;
};

const requestAuthCache = new WeakMap<Request, Promise<SessionAndRole>>();

export const getSessionAndRole = async (request: Request) => {
  const cached = requestAuthCache.get(request);
  if (cached) {
    return cached;
  }

  const pending = (async (): Promise<SessionAndRole> => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) return { session: null, role: null };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    return { session, role: user?.role ?? null };
  })();

  requestAuthCache.set(request, pending);
  return pending;
};

export const isAdminRole = (role: UserRole | null) => role === 'ADMIN';