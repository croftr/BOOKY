import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

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

/**
 * Generate an AI response for a book discussion
 * @param params - Book discussion parameters
 * @returns Promise containing the AI's response text
 */
export async function generateBookDiscussion(params: BookDiscussionParams): Promise<string> {
    const { title, category, review, userMessage, conversationHistory } = params;

    let prompt: string;

    if (conversationHistory && conversationHistory.length > 0) {
        // Continuing conversation
        const conversationContext = conversationHistory
            .map((msg) => `${msg.role === 'user' ? 'Reader' : 'You'}: ${msg.content}`)
            .join('\n\n');

        prompt = `You are having a friendly discussion about the book "${title}"${category ? ` (${category})` : ''}.

Previous conversation:
${conversationContext}

Reader: ${userMessage}

Respond naturally and engagingly to continue the discussion. Share insights, ask thought-provoking questions, or explore different perspectives about the book.`;
    } else {
        // First message - respond to review
        if (!review || review.trim() === '') {
            prompt = `A reader is interested in discussing the book "${title}"${category ? ` in the ${category} category` : ''}. They haven't written a review yet.

Start a friendly discussion by:
1. Briefly introducing what the book is about
2. Highlighting 2-3 interesting themes or aspects
3. Asking what drew them to this book or what they're curious about

Keep it conversational and engaging (2-3 paragraphs).`;
        } else {
            prompt = `A reader has finished "${title}"${category ? ` (${category})` : ''} and shared this review:

"${review}"

Respond to their review in a friendly, thoughtful way:
1. Acknowledge their specific thoughts and feelings about the book
2. Add your own insights or perspectives that relate to what they mentioned
3. Ask a follow-up question or share something interesting that connects to their review

Keep it conversational and engaging (2-3 paragraphs).`;
        }
    }

    console.log("using key ", process.env.GEMINI_API_KEY);

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
    });

    return response.text || "";
}

/**
 * Generate content using the AI client
 * @param model - The model to use (e.g., "gemini-2.0-flash-exp")
 * @param contents - The prompt/contents to send to the model
 * @returns Promise containing the AI's response text
 */
export async function generateContent(model: string, contents: string): Promise<string> {
    const response = await ai.models.generateContent({
        model,
        contents,
    });
    return response.text || "";
}

interface BookSummary {
    title: string;
    category: string;
    rating: number;
    review: string;
}

interface LibrarySummaryParams {
    books: BookSummary[];
}

/**
 * Generate a summary of all books in the library with their reviews
 * @param params - Library summary parameters containing all books
 * @returns Promise containing the AI's summary text
 */
export async function generateLibrarySummary(params: LibrarySummaryParams): Promise<string> {
    const { books } = params;

    if (books.length === 0) {
        return "You haven't added any books to your library yet.";
    }

    // Create a structured overview of the books
    const booksOverview = books
        .map((book, index) => {
            const reviewSnippet = book.review
                ? `Review: "${book.review.substring(0, 150)}${book.review.length > 150 ? '...' : ''}"`
                : 'No review written';
            return `${index + 1}. "${book.title}" (${book.category}) - ${book.rating}/5 stars
   ${reviewSnippet}`;
        })
        .join('\n\n');

    const prompt = `You are analyzing a reader's book collection. Here are ${books.length} books they've read:

${booksOverview}

Please provide a thoughtful, engaging summary (3-4 paragraphs) that:
1. Identifies patterns in their reading preferences (genres, themes, authors)
2. Highlights their favorite books based on ratings and reviews
3. Notes any interesting observations about their reading journey
4. Offers 2-3 personalized book recommendations based on what they've enjoyed

Keep the tone friendly and encouraging, as if you're a fellow book lover discussing their collection.`;

    console.log("Generating library summary using key:", process.env.GEMINI_API_KEY);

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
    });

    return response.text || "";
}

// Export the AI client for direct use if needed
export { ai };
