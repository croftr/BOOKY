import { Book } from '@/types/book';

export interface ImportBook {
  title: string;
  category: string;
  dateCompleted: string;
  review: string;
  rating: number;
}

export function importBooksFromJSON(jsonData: ImportBook[]): Book[] {
  return jsonData.map((book, index) => ({
    id: `${Date.now()}-${index}`,
    title: book.title,
    image: '', // No images in import
    rating: book.rating || 3,
    review: book.review || '',
    category: book.category || 'Uncategorized',
    dateCompleted: book.dateCompleted || new Date().toISOString().split('T')[0],
  }));
}
