'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BookList from '@/components/BookList';
import Toolbar, { SortOption, SortDirection } from '@/components/Toolbar';
import { Book } from '@/types/book';
import { fetchBooks, updateBook } from '@/lib/api';

import { CirclePlus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const fetchedBooks = await fetchBooks();
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    try {
      await updateBook(updatedBook.id, updatedBook);
      setBooks(books.map(book => book.id === updatedBook.id ? updatedBook : book));
    } catch (error) {
      console.error('Failed to update book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    // Apply rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(book => book.rating >= selectedRating);
    }

    // Sort books
    const sorted = [...filtered];
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'completion':
        sorted.sort((a, b) => direction * ((a.completionOrder || 0) - (b.completionOrder || 0)));
        break;
      case 'title':
        sorted.sort((a, b) => direction * a.title.localeCompare(b.title));
        break;
      case 'rating':
        sorted.sort((a, b) => direction * (b.rating - a.rating));
        break;
      case 'date':
        sorted.sort((a, b) => {
          if (!a.dateCompleted) return 1;
          if (!b.dateCompleted) return -1;
          return direction * (new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime());
        });
        break;
    }

    return sorted;
  }, [books, searchQuery, selectedCategory, selectedRating, sortBy, sortDirection]);

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

        {!isLoading && books.length > 0 && (
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
            bookCount={filteredAndSortedBooks.length}
          />
        )}

        {isLoading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading books...</div>
        ) : (
          <BookList books={filteredAndSortedBooks} onUpdateBook={handleUpdateBook} />
        )}
      </div>
    </div>
  );
}
