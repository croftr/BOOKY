import { NextRequest, NextResponse } from 'next/server';
import { generateLibrarySummary } from '@/app/api/utils/aiClient';

export async function POST(request: NextRequest) {
    try {
        const { books } = await request.json();

        if (!books || !Array.isArray(books)) {
            return NextResponse.json(
                { error: 'Books array is required' },
                { status: 400 }
            );
        }

        const summary = await generateLibrarySummary({ books });

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Error generating library summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate library summary' },
            { status: 500 }
        );
    }
}
