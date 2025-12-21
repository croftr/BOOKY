import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Book } from '@/types/book';

const DATA_FILE = path.join(process.cwd(), 'data', 'books.json');

async function readBooks(): Promise<Book[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeBooks(books: Book[]): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
}

// GET single book by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const books = await readBooks();
    const book = books.find((b) => b.id === id);

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read book' }, { status: 500 });
  }
}

// PUT (update) book by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedBook: Book = await request.json();
    const books = await readBooks();
    const index = books.findIndex((b) => b.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    books[index] = { ...books[index], ...updatedBook };
    await writeBooks(books);
    return NextResponse.json(books[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

// DELETE book by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const books = await readBooks();
    const filteredBooks = books.filter((b) => b.id !== id);

    if (filteredBooks.length === books.length) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    await writeBooks(filteredBooks);
    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
