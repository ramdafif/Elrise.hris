import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/nusantara_hris?schema=public';

export const isValidPostgresUrl = (url?: string): boolean =>
  typeof url === 'string' && (url.startsWith('postgresql://') || url.startsWith('postgres://'));

// Ensure process.env.DATABASE_URL is a valid PostgreSQL URL
if (!isValidPostgresUrl(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

const resolvedDbUrl = isValidPostgresUrl(process.env.DATABASE_URL)
  ? process.env.DATABASE_URL!
  : DEFAULT_DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAvailable: boolean | null;
};

// Use silent logging so connection failures in local development do not emit prisma:error to stderr
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolvedDbUrl,
    log: [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function isPrismaAvailable(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    return false;
  }

  if (globalForPrisma.prismaAvailable !== undefined && globalForPrisma.prismaAvailable !== null) {
    return globalForPrisma.prismaAvailable;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !isValidPostgresUrl(dbUrl)) {
    globalForPrisma.prismaAvailable = false;
    return false;
  }

  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname || 'localhost';
    const port = parseInt(parsed.port || '5432', 10);

    // Fast socket probe (200ms) without triggering PrismaClientInitializationError
    const net = await import('net');
    const reachable = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(200);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });

    if (!reachable) {
      globalForPrisma.prismaAvailable = false;
      return false;
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 500)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    globalForPrisma.prismaAvailable = true;
    return true;
  } catch {
    globalForPrisma.prismaAvailable = false;
    return false;
  }
}

export default prisma;
