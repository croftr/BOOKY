'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BookList from '@/components/BookList';
import Toolbar, { SortOption, SortDirection } from '@/components/Toolbar';
import ImportDataModal from '@/components/ImportDataModal';
import { Book } from '@/types/book';
import { fetchBooks, updateBook } from '@/lib/api';

import { CirclePlus, Download, Upload, BarChart3, Loader2 } from 'lucide-react';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasAnyBooks, setHasAnyBooks] = useState(false);

  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [showCurrentlyReading, setShowCurrentlyReading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const pageSize = 30;

  // Cache of all books (used for export)
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allBooksLoaded, setAllBooksLoaded] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Infinite scroll ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Stable callback for Toolbar's debounced search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRating, showCurrentlyReading, sortBy, sortDirection, searchQuery]);

  const loadBooks = useCallback(async (append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetchBooks({
        category: selectedCategory || undefined,
        minRating: selectedRating > 0 ? selectedRating : undefined,
        currentlyReading: showCurrentlyReading ? true : undefined,
        search: searchQuery.length >= 3 ? searchQuery : undefined,
        sortBy: sortOptionToApiField(sortBy),
        sortOrder: sortDirection,
        page: currentPage,
        limit: pageSize,
      });

      if (append) {
        setBooks(prev => [...prev, ...response.items]);
      } else {
        setBooks(response.items);
      }

      setTotalBooks(response.total);
      setTotalPages(response.totalPages);

      // Track if any books exist at all (for initial load)
      if (!hasAnyBooks && response.total > 0) {
        setHasAnyBooks(true);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, selectedRating, showCurrentlyReading, searchQuery, sortBy, sortDirection, currentPage, hasAnyBooks]);

  // Load books whenever filter, sort, or pagination parameters change
  useEffect(() => {
    const isLoadMore = currentPage > 1;
    loadBooks(isLoadMore);
  }, [loadBooks, currentPage]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && currentPage < totalPages) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading, isLoadingMore, totalPages, currentPage]);

  const handleUpdateBook = useCallback(async (updatedBook: Book) => {
    try {
      await updateBook(updatedBook.id, updatedBook);
      // Update local state to reflect changes without reloading everything
      setBooks(prevBooks => prevBooks.map(b => b.id === updatedBook.id ? updatedBook : b));
    } catch (error) {
      console.error('Failed to update book:', error);
      alert('Failed to update book. Please try again.');
    }
  }, []);

  const loadAllBooks = async (): Promise<Book[]> => {
    // Return the cached copy if we already have it (state is populated from a
    // prior render in that case, so it's safe to read here).
    if (allBooksLoaded) {
      return allBooks;
    }
    try {
      const response = await fetchBooks({
        limit: 1000, // Get all books
      });
      setAllBooks(response.items);
      setAllBooksLoaded(true);
      return response.items;
    } catch (error) {
      console.error('Error loading all books:', error);
      throw error;
    }
  };

  const handleExportData = async () => {
    try {
      // Use the returned books directly — reading the `allBooks` state here would
      // see the pre-update (empty) value on the same tick that loadAllBooks sets it.
      const books = await loadAllBooks();

      // Create export data with timestamp
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalBooks: books.length,
        books,
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `book-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${books.length} books!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportComplete = async () => {
    // Reload books after import and invalidate cache
    setAllBooksLoaded(false);
    setCurrentPage(1);
    // Force reload if we are already at page 1, otherwise useEffect will trigger
    if (currentPage === 1) {
        loadBooks(false);
    }
    setShowImportModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex items-center mb-6 justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt="Book Tracker"
              className="w-10 h-10"
            />
            <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-300 sm:hidden">
              Book Tracker
            </h1>
          </div>

          <h1 className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            Book Tracker
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/create')}
              className="p-2 bg-blue-600 text-white rounded-4xl font-medium shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
              title="Add new book"
            >
              <CirclePlus size={20} />
            </button>

            {totalBooks > 0 && (
              <>
                <button
                  onClick={() => router.push('/stats')}
                  className="p-2 bg-orange-600 text-white rounded-4xl font-medium shadow-md hover:bg-orange-700 transition-colors cursor-pointer"
                  title="View statistics"
                >
                  <BarChart3 size={20} />
                </button>

                <button
                  onClick={handleExportData}
                  className="p-2 bg-green-600 text-white rounded-4xl font-medium shadow-md hover:bg-green-700 transition-colors cursor-pointer"
                  title="Export all data"
                >
                  <Download size={20} />
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-2 bg-purple-600 text-white rounded-4xl font-medium shadow-md hover:bg-purple-700 transition-colors cursor-pointer"
                  title="Import data"
                >
                  <Upload size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {hasAnyBooks && (
          <Toolbar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
            showCurrentlyReading={showCurrentlyReading}
            onShowCurrentlyReadingChange={setShowCurrentlyReading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            onSearchChange={handleSearchChange}
            bookCount={totalBooks}
          />
        )}

        {isLoading && !hasAnyBooks ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading books...</div>
        ) : books.length === 0 && !hasAnyBooks ? (
          <BookList books={books} onUpdateBook={handleUpdateBook} />
        ) : books.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No books found matching your filters.
          </div>
        ) : (
          <>
            <BookList books={books} onUpdateBook={handleUpdateBook} />

            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
               {isLoadingMore && (
                 <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                   <Loader2 className="animate-spin" size={20} />
                   <span>Loading more...</span>
                 </div>
               )}
            </div>
          </>
        )}

        {/* Import Data Modal */}
        <ImportDataModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      </div>
    </div>
  );
}
