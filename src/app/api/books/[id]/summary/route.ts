import { NextRequest, NextResponse } from 'next/server';
import { generateBookDiscussion } from '@/app/api/utils/aiClient';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params in Next.js 15
        await params;

        const { title, review, category, userMessage, conversationHistory } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Book title is required' },
                { status: 400 }
            );
        }

        const message = await generateBookDiscussion({
            title,
            category,
            review,
            userMessage,
            conversationHistory,
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error generating response:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
