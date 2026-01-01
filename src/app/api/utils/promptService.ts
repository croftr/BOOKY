import { Book } from '@/types/book';

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface BookDiscussionParams {
    title: string;
    category?: string;
    review?: string;
    userMessage?: string;
    conversationHistory?: ConversationMessage[];
}

interface LibraryChatParams {
    books: Book[];
    conversationHistory?: ConversationMessage[];
    userMessage?: string;
}

interface LibrarySummaryParams {
    books: Array<{
        title: string;
        category: string;
        rating: number;
        review: string;
    }>;
}

/**
 * Generate prompt for continuing a book discussion
 */
export function getBookDiscussionContinuationPrompt(params: {
    title: string;
    category?: string;
    conversationHistory: ConversationMessage[];
    userMessage: string;
}): string {
    const { title, category, conversationHistory, userMessage } = params;

    const conversationContext = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Reader' : 'You'}: ${msg.content}`)
        .join('\n\n');

    return `You are having a discussion about the book "${title}"${category ? ` (${category})` : ''}.

Previous conversation:
${conversationContext}

Reader: ${userMessage}

Respond naturally to continue the discussion. Share insights, or explore different perspectives about the book. It's also good to focus on any controversies the book may have sparked. Has the book upset anyone or started a debate? Also feel free to link to youtube videos regarding controversies of the book or even controversies sparked by the users own comments.`;
}

/**
 * Generate prompt for starting a book discussion (with review)
 */
export function getBookDiscussionInitialPromptWithReview(params: {
    title: string;
    category?: string;
    review: string;
}): string {
    const { title, category, review } = params;

    return `A reader has finished "${title}"${category ? ` (${category})` : ''} and shared this review:

"${review}"

Respond to their review in a friendly, thoughtful way:
1. Acknowledge their specific thoughts and feelings about the book
2. Add your own insights or perspectives that relate to what they mentioned
3. Ask a follow-up question or share something interesting that connects to their review

Keep it conversational and engaging (2-3 paragraphs).`;
}

/**
 * Generate prompt for starting a book discussion (without review)
 */
export function getBookDiscussionInitialPromptWithoutReview(params: {
    title: string;
    category?: string;
}): string {
    const { title, category } = params;

    return `A reader is interested in discussing the book "${title}"${category ? ` in the ${category} category` : ''}. They haven't written a review yet.

Start a friendly discussion by:
1. Briefly introducing what the book is about
2. Highlighting 2-3 interesting themes or aspects
3. Asking what drew them to this book or what they're curious about

Keep it conversational and engaging (2-3 paragraphs).`;
}

/**
 * Generate prompt for library chat greeting (first message)
 */
export function getLibraryChatGreetingPrompt(params: {
    bookCount: number;
    books: Book[];
}): string {
    const { bookCount, books } = params;

    const booksOverview = books
        .map((book, index) => {
            const reviewSnippet = book.review
                ? `Review: "${book.review.substring(0, 100)}${book.review.length > 100 ? '...' : ''}"`
                : 'No review written';
            return `${index + 1}. "${book.title}" (${book.category}) - ${book.rating}/5 stars
   ${reviewSnippet}`;
        })
        .join('\n\n');

    return `You are a friendly AI book companion having a conversation with a reader about their book collection.

Here are the ${bookCount} books they've read:

${booksOverview}

This is the start of the conversation. Greet them warmly and say something like "Hey! I can see you've read ${bookCount} ${bookCount === 1 ? 'book' : 'books'}! Shall we discuss them?"

Keep it friendly, casual, and inviting. Make it feel like a conversation with a fellow book lover. (2-3 sentences max)`;
}

/**
 * Generate prompt for continuing library chat conversation
 */
export function getLibraryChatContinuationPrompt(params: {
    books: Book[];
    conversationHistory: ConversationMessage[];
    userMessage: string;
}): string {
    const { books, conversationHistory, userMessage } = params;

    const conversationContext = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Reader' : 'You'}: ${msg.content}`)
        .join('\n\n');

    const booksOverview = books
        .map((book) => {
            return `"${book.title}" (${book.category}) - ${book.rating}/5 stars - Review: ${book.review || 'No review'}`;
        })
        .join('\n');

    return `You are a friendly AI book companion having a conversation with a reader about their book collection.

Here are all the books in their library:
${booksOverview}

Previous conversation:
${conversationContext}

Reader: ${userMessage}

Respond naturally and engagingly. Use your knowledge about these books and general book knowledge to have a meaningful discussion. You can:
- Discuss themes, characters, and ideas from books they've read
- Make connections between books in their collection
- Ask thoughtful questions about their reading preferences
- Recommend books based on what they've enjoyed
- Share interesting insights or perspectives

Keep responses conversational and friendly (2-4 paragraphs max). Focus on the specific books they've read when relevant.`;
}

/**
 * Generate prompt for library summary
 */
export function getLibrarySummaryPrompt(params: LibrarySummaryParams): string {
    const { books } = params;

    if (books.length === 0) {
        return '';
    }

    const booksOverview = books
        .map((book, index) => {
            const reviewSnippet = book.review
                ? `Review: "${book.review.substring(0, 150)}${book.review.length > 150 ? '...' : ''}"`
                : 'No review written';
            return `${index + 1}. "${book.title}" (${book.category}) - ${book.rating}/5 stars
   ${reviewSnippet}`;
        })
        .join('\n\n');

    return `You are analyzing a reader's book collection. Here are ${books.length} books they've read:

${booksOverview}

Please provide a thoughtful, engaging summary (3-4 paragraphs) that:
1. Identifies patterns in their reading preferences (genres, themes, authors)
2. Highlights their favorite books based on ratings and reviews
3. Notes any interesting observations about their reading journey
4. Offers 2-3 personalized book recommendations based on what they've enjoyed

Keep the tone friendly and encouraging, as if you're a fellow book lover discussing their collection.`;
}
