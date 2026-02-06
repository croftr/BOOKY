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

// GET all books with optional query parameters
export async function GET(request: NextRequest) {
  try {
    let books = await readBooks();
    const searchParams = request.nextUrl.searchParams;

    // Parse all parameters first
    const category = searchParams.get('category');

    const rating = searchParams.get('rating');
    const minRating = searchParams.get('minRating');
    const ratingValue = rating ? parseInt(rating) : undefined;
    const minRatingValue = minRating ? parseInt(minRating) : undefined;

    const title = searchParams.get('title');
    const review = searchParams.get('review');

    const dateCompleted = searchParams.get('dateCompleted');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const completionOrder = searchParams.get('completionOrder');
    const minOrder = searchParams.get('minOrder');
    const maxOrder = searchParams.get('maxOrder');
    const orderValue = completionOrder ? parseInt(completionOrder) : undefined;
    const minOrderValue = minOrder ? parseInt(minOrder) : undefined;
    const maxOrderValue = maxOrder ? parseInt(maxOrder) : undefined;

    const currentlyReading = searchParams.get('currentlyReading');
    const isCurrentlyReading = currentlyReading === 'true';

    // Single pass filter
    books = books.filter(book => {
      // Filter by category
      if (category && book.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }

      // Filter by rating (exact match or minimum rating)
      if (ratingValue !== undefined) {
        if (book.rating !== ratingValue) return false;
      } else if (minRatingValue !== undefined) {
        if (!(book.rating >= minRatingValue)) return false;
      }

      // Filter by title (case-insensitive partial match)
      if (title && !book.title.toLowerCase().includes(title.toLowerCase())) {
        return false;
      }

      // Filter by review (case-insensitive partial match)
      if (review && !book.review.toLowerCase().includes(review.toLowerCase())) {
        return false;
      }

      // Filter by completion date (exact date or date range)
      if (dateCompleted) {
        if (book.dateCompleted !== dateCompleted) return false;
      } else {
        if (dateFrom && book.dateCompleted < dateFrom) return false;
        if (dateTo && book.dateCompleted > dateTo) return false;
      }

      // Filter by completion order (exact or range)
      if (orderValue !== undefined) {
        if (book.completionOrder !== orderValue) return false;
      } else {
        if (minOrderValue !== undefined && !(book.completionOrder >= minOrderValue)) return false;
        if (maxOrderValue !== undefined && !(book.completionOrder <= maxOrderValue)) return false;
      }

      // Filter by currently reading status
      if (currentlyReading !== null) {
        const bookIsReading = !!book.currentlyReading;
        if (isCurrentlyReading !== bookIsReading) return false;
      }

      return true;
    });

    // Sort results
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    if (sortBy) {
      books.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'category':
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          case 'dateCompleted':
            aValue = a.dateCompleted;
            bValue = b.dateCompleted;
            break;
          case 'completionOrder':
            aValue = a.completionOrder;
            bValue = b.completionOrder;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const total = books.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedBooks = books.slice(skip, skip + limit);

    return NextResponse.json({
      items: paginatedBooks,
      total,
      page,
      limit,
      totalPages
    });
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
