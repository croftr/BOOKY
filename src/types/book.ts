export interface ExternalLink {
    id: string;
    type: 'youtube' | 'review' | 'article' | 'other';
    url: string;
    title: string;
    description?: string;
}

export interface Book {
    id: string;
    title: string;
    image: string; // data URL or URL
    rating: number; // 0-5 (0 = not rated)
    review: string;
    category: string;
    currentlyReading?: boolean;
    dateCompleted: string; // ISO string (optional - can be empty)
    completionOrder: number; // Order in which books were completed
    externalLinks?: ExternalLink[]; // External resources (YouTube, reviews, etc.)
    reviewImages?: string[]; // Attached images for the review
}