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

// GET all books
export async function GET() {
  try {
    const books = await readBooks();
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read books' }, { status: 500 });
  }
}

// POST new book
export async function POST(request: NextRequest) {
  try {
    const newBook: Book = await request.json();
    const books = await readBooks();

    // Check if we need to shift existing books
    if (newBook.completionOrder) {
      let needsSort = false;
      books.forEach(book => {
        if (book.completionOrder >= newBook.completionOrder) {
          book.completionOrder += 1;
          needsSort = true;
        }
      });
    }

    books.push(newBook);
    await writeBooks(books);
    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

// DELETE all books (optional - for clearing data)
export async function DELETE() {
  try {
    await writeBooks([]);
    return NextResponse.json({ message: 'All books deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete books' }, { status: 500 });
  }
}
