import { PrismaClient } from '@prisma/client';

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS ?? 250);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Keep the app runtime close to Neon region; cross-region RTT can dominate query latency.
    // Prefer a pooled Neon URL when provided to reduce connection churn on serverless runtimes.
    ...(process.env.DATABASE_URL_POOLED
      ? {
          datasources: {
            db: {
              url: process.env.DATABASE_URL_POOLED,
            },
          },
        }
      : {}),
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = Date.now();
          try {
            return await query(args);
          } finally {
            const durationMs = Date.now() - startedAt;
            if (durationMs >= SLOW_QUERY_MS) {
              console.warn(
                `[prisma][slow-query] ${model ?? 'raw'}.${operation} took ${durationMs}ms`,
              );
            }
          }
        },
      },
    },
  });
};

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}