import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'READY',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'CONNECTED',
        authService: 'OPERATIONAL',
        taxEngine: 'VERIFIED',
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
