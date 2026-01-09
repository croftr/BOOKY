import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { Book } from '@/types/book';

const BOOKS_KEY = 'books';

async function readBooks(): Promise<Book[]> {
  try {
    const redis = getRedis();
    const data = await redis.get(BOOKS_KEY);
    if (!data) return [];
    return JSON.parse(data) as Book[];
  } catch (error) {
    console.error('Error reading books from Redis:', error);
    return [];
  }
}

async function writeBooks(books: Book[]): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(BOOKS_KEY, JSON.stringify(books));
  } catch (error) {
    console.error('Error writing books to Redis:', error);
    throw error;
  }
}

// POST bulk create books
export async function POST(request: NextRequest) {
  try {
    const newBooks: Book[] = await request.json();

    if (!Array.isArray(newBooks)) {
      return NextResponse.json(
        { error: 'Request body must be an array of books' },
        { status: 400 }
      );
    }

    if (newBooks.length === 0) {
      return NextResponse.json(
        { error: 'Cannot import empty array' },
        { status: 400 }
      );
    }

    const existingBooks = await readBooks();

    // Check if we need to shift existing books for any new book with completionOrder
    const booksWithOrder = newBooks.filter(book => book.completionOrder !== undefined);

    if (booksWithOrder.length > 0) {
      // Find the minimum completionOrder from new books
      const minNewOrder = Math.min(...booksWithOrder.map(b => b.completionOrder));

      // Shift existing books that would conflict
      existingBooks.forEach(book => {
        if (book.completionOrder >= minNewOrder) {
          book.completionOrder += newBooks.length;
        }
      });
    }

    // Combine existing and new books
    const allBooks = [...existingBooks, ...newBooks];

    await writeBooks(allBooks);

    return NextResponse.json({
      message: 'Books imported successfully',
      imported: newBooks.length,
      total: allBooks.length
    }, { status: 201 });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import books' },
      { status: 500 }
    );
  }
}
