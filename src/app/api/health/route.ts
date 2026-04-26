import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

/**
 * Health check endpoint to verify Storage connection
 * Visit /api/health to check if Cloud Storage is properly configured
 */
export async function GET() {
  try {
    // Check if Blob storage is accessible
    const { blobs } = await list({ limit: 1 });
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Cloud Storage (Vercel Blob) is working correctly',
      blobsCount: blobs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Cloud Storage is not configured or not accessible',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

