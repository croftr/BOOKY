import { GoogleGenAI } from "@google/genai";
import { Book } from '@/types/book';
import {
    getBookDiscussionContinuationPrompt,
    getBookDiscussionInitialPromptWithReview,
    getBookDiscussionInitialPromptWithoutReview,
    getLibraryChatGreetingPrompt,
    getLibraryChatContinuationPrompt,
    getLibrarySummaryPrompt,
} from './promptService';

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

interface LibraryChatParams {
    books: Book[];
    conversationHistory?: ConversationMessage[];
    userMessage?: string;
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
 * Generate an AI response for a book discussion
 * @param params - Book discussion parameters
 * @returns Promise containing the AI's response text
 */
export async function generateBookDiscussion(params: BookDiscussionParams): Promise<string> {
    const { title, category, review, userMessage, conversationHistory } = params;

    let prompt: string;

    if (conversationHistory && conversationHistory.length > 0) {
        // Continuing conversation
        prompt = getBookDiscussionContinuationPrompt({
            title,
            category,
            conversationHistory,
            userMessage: userMessage || '',
        });
        console.log("aaa", prompt);

    } else {
        // First message - respond to review
        if (!review || review.trim() === '') {
            prompt = getBookDiscussionInitialPromptWithoutReview({
                title,
                category,
            });
        } else {
            prompt = getBookDiscussionInitialPromptWithReview({
                title,
                category,
                review,
            });
        }
        console.log("bbb", prompt);
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
    });

    return response.text || "";
}

/**
 * Generate an AI response for library chat
 * @param params - Library chat parameters
 * @returns Promise containing the AI's response text
 */
export async function generateLibraryChat(params: LibraryChatParams): Promise<string> {
    const { books, conversationHistory, userMessage } = params;

    let prompt: string;

    if (!conversationHistory || conversationHistory.length === 0) {
        // First message - greeting
        prompt = getLibraryChatGreetingPrompt({
            bookCount: books.length,
            books,
        });
    } else {
        // Continuing conversation
        prompt = getLibraryChatContinuationPrompt({
            books,
            conversationHistory,
            userMessage: userMessage || '',
        });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
    });

    return response.text || "";
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

    const prompt = getLibrarySummaryPrompt({ books });

    console.log("Generating library summary using key:", process.env.GEMINI_API_KEY);

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

// Export the AI client for direct use if needed
export { ai };
