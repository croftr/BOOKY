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

    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      books = books.filter(book =>
        book.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by rating (exact match or minimum rating)
    const rating = searchParams.get('rating');
    const minRating = searchParams.get('minRating');
    if (rating) {
      const ratingValue = parseInt(rating);
      books = books.filter(book => book.rating === ratingValue);
    } else if (minRating) {
      const minRatingValue = parseInt(minRating);
      books = books.filter(book => book.rating >= minRatingValue);
    }

    // Filter by title (case-insensitive partial match)
    const title = searchParams.get('title');
    if (title) {
      books = books.filter(book =>
        book.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    // Filter by review (case-insensitive partial match)
    const review = searchParams.get('review');
    if (review) {
      books = books.filter(book =>
        book.review.toLowerCase().includes(review.toLowerCase())
      );
    }

    // Filter by completion date (exact date or date range)
    const dateCompleted = searchParams.get('dateCompleted');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (dateCompleted) {
      books = books.filter(book => book.dateCompleted === dateCompleted);
    } else {
      if (dateFrom) {
        books = books.filter(book => book.dateCompleted >= dateFrom);
      }
      if (dateTo) {
        books = books.filter(book => book.dateCompleted <= dateTo);
      }
    }

    // Filter by completion order (exact or range)
    const completionOrder = searchParams.get('completionOrder');
    const minOrder = searchParams.get('minOrder');
    const maxOrder = searchParams.get('maxOrder');

    if (completionOrder) {
      const orderValue = parseInt(completionOrder);
      books = books.filter(book => book.completionOrder === orderValue);
    } else {
      if (minOrder) {
        const minOrderValue = parseInt(minOrder);
        books = books.filter(book => book.completionOrder >= minOrderValue);
      }
      if (maxOrder) {
        const maxOrderValue = parseInt(maxOrder);
        books = books.filter(book => book.completionOrder <= maxOrderValue);
      }
    }

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
