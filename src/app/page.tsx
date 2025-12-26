'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookList from '@/components/BookList';
import Toolbar, { SortOption, SortDirection } from '@/components/Toolbar';
import { Book } from '@/types/book';
import { fetchBooks, updateBook } from '@/lib/api';

import { CirclePlus } from 'lucide-react';

// Map UI sort options to API sort fields
const sortOptionToApiField = (sortOption: SortOption): string => {
  switch (sortOption) {
    case 'completion':
      return 'completionOrder';
    case 'title':
      return 'title';
    case 'rating':
      return 'rating';
    case 'date':
      return 'dateCompleted';
    default:
      return 'completionOrder';
  }
};

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyBooks, setHasAnyBooks] = useState(false);

  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load books whenever filter or sort parameters change
  // Only search by title if 3 or more characters
  useEffect(() => {
    loadBooks();
  }, [selectedCategory, selectedRating, sortBy, sortDirection, debouncedSearchQuery]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const fetchedBooks = await fetchBooks({
        category: selectedCategory || undefined,
        minRating: selectedRating > 0 ? selectedRating : undefined,
        title: debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : undefined,
        sortBy: sortOptionToApiField(sortBy),
        sortOrder: sortDirection,
      });
      setBooks(fetchedBooks);

      // Track if any books exist at all (for initial load)
      if (!hasAnyBooks && fetchedBooks.length > 0) {
        setHasAnyBooks(true);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    try {
      await updateBook(updatedBook.id, updatedBook);
      // Reload books to get fresh data from API
      await loadBooks();
    } catch (error) {
      console.error('Failed to update book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8 justify-center gap-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Book Tracker</h1>

          <button
            onClick={() => router.push('/create')}
            className="p-2 bg-blue-600 text-white rounded-4xl font-medium shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <CirclePlus size={20} />
          </button>
        </div>

        {!isLoading && hasAnyBooks && (
          <Toolbar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            bookCount={books.length}
          />
        )}

        {isLoading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading books...</div>
        ) : books.length === 0 && !hasAnyBooks ? (
          <BookList books={books} onUpdateBook={handleUpdateBook} />
        ) : books.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No books found matching your filters.
          </div>
        ) : (
          <BookList books={books} onUpdateBook={handleUpdateBook} />
        )}
      </div>
    </div>
  );
}
