import { Book } from '@/types/book';

export interface ImportBook extends Partial<Book> {
  title?: string;
  category?: string;
}

export interface ValidationResult {
  valid: ImportBook[];
  invalid: Array<{
    book: ImportBook;
    reason: string;
  }>;
  duplicates: Array<{
    book: ImportBook;
    existingId: string;
  }>;
}

export function validateImportData(
  importData: any,
  existingBooks: Book[]
): ValidationResult {
  const result: ValidationResult = {
    valid: [],
    invalid: [],
    duplicates: [],
  };

  // Validate the import data structure
  if (!importData || typeof importData !== 'object') {
    throw new Error('Invalid import file: must be a valid JSON object');
  }

  // Extract books array
  let booksToImport: ImportBook[] = [];

  if (Array.isArray(importData)) {
    booksToImport = importData;
  } else if (importData.books && Array.isArray(importData.books)) {
    booksToImport = importData.books;
  } else {
    throw new Error('Invalid import file: no books array found');
  }

  // Create a map of existing book titles (case-insensitive and trimmed)
  const existingTitlesMap = new Map<string, string>();
  existingBooks.forEach(book => {
    existingTitlesMap.set(book.title.trim().toLowerCase(), book.id);
  });

  // Create a set of existing completionOrder values
  const existingCompletionOrders = new Set<number>();
  existingBooks.forEach(book => {
    if (book.completionOrder !== undefined && book.completionOrder !== null) {
      existingCompletionOrders.add(book.completionOrder);
    }
  });

  // Validate each book
  booksToImport.forEach((book, index) => {
    // Check required fields
    if (!book.title || book.title.trim() === '') {
      result.invalid.push({
        book,
        reason: 'Missing required field: title',
      });
      return;
    }

    if (!book.category || book.category.trim() === '') {
      result.invalid.push({
        book,
        reason: 'Missing required field: category',
      });
      return;
    }

    // Check for duplicate titles in existing books
    const normalizedTitle = book.title.trim().toLowerCase();
    if (existingTitlesMap.has(normalizedTitle)) {
      result.duplicates.push({
        book,
        existingId: existingTitlesMap.get(normalizedTitle)!,
      });
      return;
    }

    // Check for conflicting completionOrder
    if (book.completionOrder !== undefined && book.completionOrder !== null) {
      if (existingCompletionOrders.has(book.completionOrder)) {
        result.invalid.push({
          book,
          reason: `Completion order ${book.completionOrder} already exists`,
        });
        return;
      }
    }

    // Book is valid
    result.valid.push(book);
  });

  return result;
}

export function parseImportFile(fileContent: string): any {
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid JSON file: unable to parse content');
  }
}
