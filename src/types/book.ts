export interface Book {
    id: string;
    title: string;
    image: string; // data URL or URL
    rating: number; // 1-5
    review: string;
    category: string;
    dateCompleted: string; // ISO string
}