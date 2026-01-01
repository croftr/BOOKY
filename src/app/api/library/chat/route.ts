import { NextRequest, NextResponse } from 'next/server';
import { generateLibraryChat } from '@/app/api/utils/aiClient';
import { Book } from '@/types/book';

export async function POST(request: NextRequest) {
    try {
        const { books, conversationHistory, userMessage } = await request.json();

        if (!books || !Array.isArray(books)) {
            return NextResponse.json(
                { error: 'Books array is required' },
                { status: 400 }
            );
        }

        const response = await generateLibraryChat({
            books: books as Book[],
            conversationHistory,
            userMessage,
        });

        return NextResponse.json({ message: response });
    } catch (error) {
        console.error('Error generating chat response:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
