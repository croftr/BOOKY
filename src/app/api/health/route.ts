import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * Health check endpoint to verify KV connection
 * Visit /api/health to check if KV is properly configured
 */
export async function GET() {
  try {
    // Try to ping KV
    const testKey = 'health-check';
    const testValue = new Date().toISOString();

    await kv.set(testKey, testValue);
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);

    const isWorking = retrieved === testValue;

    if (isWorking) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Vercel KV is working correctly',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'KV read/write test failed',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Vercel KV is not configured or not accessible',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
