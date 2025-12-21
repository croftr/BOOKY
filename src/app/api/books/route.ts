import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Book } from '@/types/book';

const BOOKS_KEY = 'books';

async function readBooks(): Promise<Book[]> {
  try {
    const books = await kv.get<Book[]>(BOOKS_KEY);
    return books || [];
  } catch (error) {
    console.error('Error reading books from KV:', error);
    return [];
  }
}

async function writeBooks(books: Book[]): Promise<void> {
  try {
    await kv.set(BOOKS_KEY, books);
  } catch (error) {
    console.error('Error writing books to KV:', error);
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
