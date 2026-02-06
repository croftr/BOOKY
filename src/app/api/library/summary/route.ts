import { NextRequest, NextResponse } from 'next/server';
import { generateLibrarySummary } from '@/app/api/utils/aiClient';
import { getRedis } from '@/lib/redis';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
    try {
        const { books } = await request.json();

        if (!books || !Array.isArray(books)) {
            return NextResponse.json(
                { error: 'Books array is required' },
                { status: 400 }
            );
        }

        // Generate cache key based on books content
        const booksHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(books))
            .digest('hex');
        const cacheKey = `library:summary:${booksHash}`;

        // Check cache
        const redis = getRedis();
        let cachedSummary: string | null = null;
        try {
            cachedSummary = await redis.get(cacheKey);
        } catch (e) {
            console.error('Failed to retrieve summary from cache:', e);
        }

        if (cachedSummary) {
            return NextResponse.json({ summary: cachedSummary });
        }

        const summary = await generateLibrarySummary({ books });

        // Cache the result for 24 hours
        try {
            await redis.set(cacheKey, summary, 'EX', 60 * 60 * 24);
        } catch (e) {
            console.error('Failed to cache summary:', e);
        }

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Error generating library summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate library summary' },
            { status: 500 }
        );
    }
}
