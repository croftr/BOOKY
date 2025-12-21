import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Book } from '@/types/book';

const DATA_FILE = path.join(process.cwd(), 'data', 'books.json');

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readBooks(): Promise<Book[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

async function writeBooks(books: Book[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
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
