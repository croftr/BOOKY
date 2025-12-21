import { Book } from '@/types/book';

export interface ImportBook {
  title: string;
  category: string;
  dateCompleted: string;
  review: string;
  rating: number;
}

export function importBooksFromJSON(jsonData: ImportBook[], startOrder: number = 1): Book[] {
  return jsonData.map((book, index) => ({
    id: `${Date.now()}-${index}`,
    title: book.title,
    image: '', // No images in import
    rating: book.rating || 0,
    review: book.review || '',
    category: book.category || 'Uncategorized',
    dateCompleted: book.dateCompleted || '',
    completionOrder: startOrder + index,
  }));
}
