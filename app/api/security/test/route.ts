import { NextResponse } from 'next/server';
import { runTests } from '@/tests/security/run-security-tests';

export async function POST() {
  try {
    const report = await runTests();
    return NextResponse.json({
      success: report.failed === 0,
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export const GET = POST;
