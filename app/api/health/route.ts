import { NextResponse } from 'next/server';

export async function GET() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return NextResponse.json(
    {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
      system: 'Nusantara HRIS Enterprise',
      version: '0.1.0',
      checks: {
        application: 'HEALTHY',
        memory: {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
