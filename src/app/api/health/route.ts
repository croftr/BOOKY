import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/**
 * Health check endpoint to verify Redis connection
 * Visit /api/health to check if Redis is properly configured
 */
export async function GET() {
  try {
    const redis = getRedis();
    const testKey = 'health-check';
    const testValue = new Date().toISOString();

    await redis.set(testKey, testValue);
    const retrieved = await redis.get(testKey);
    await redis.del(testKey);

    const isWorking = retrieved === testValue;

    if (isWorking) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Redis is working correctly',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Redis read/write test failed',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Redis is not configured or not accessible',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
