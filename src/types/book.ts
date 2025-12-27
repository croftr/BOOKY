export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ExternalLink {
    id: string;
    type: 'youtube' | 'review' | 'article' | 'other';
    url: string;
    title: string;
    description?: string;
}

export interface GoogleBooksInfo {
    description?: string;
    publishedDate?: string;
    publisher?: string;
    authors?: string[];
    pageCount?: number;
    infoLink?: string;
    previewLink?: string;
}

export interface Book {
    id: string;
    title: string;
    image: string; // data URL or URL
    rating: number; // 0-5 (0 = not rated)
    review: string;
    category: string;
    dateCompleted: string; // ISO string (optional - can be empty)
    completionOrder: number; // Order in which books were completed
    aiSummary?: string; // AI-generated summary (optional)
    conversation?: ConversationMessage[]; // Conversation history with AI
    externalLinks?: ExternalLink[]; // External resources (YouTube, reviews, etc.)
    googleBooksInfo?: GoogleBooksInfo; // Information from Google Books API
}