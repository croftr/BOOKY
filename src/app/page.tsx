'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookList from '@/components/BookList';
import Toolbar, { SortOption, SortDirection } from '@/components/Toolbar';
import { Pagination } from '@/components/Pagination';
import BookChatModal from '@/components/BookChatModal';
import ImportDataModal from '@/components/ImportDataModal';
import { Book } from '@/types/book';
import { fetchBooks, updateBook } from '@/lib/api';

import { CirclePlus, Download, Upload, BarChart3 } from 'lucide-react';

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
  const [showCurrentlyReading, setShowCurrentlyReading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const pageSize = 100;

  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allBooksLoaded, setAllBooksLoaded] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRating, showCurrentlyReading, sortBy, sortDirection, debouncedSearchQuery]);

  // Load books whenever filter, sort, or pagination parameters change
  // Only search by title if 3 or more characters
  useEffect(() => {
    loadBooks();
  }, [selectedCategory, selectedRating, showCurrentlyReading, sortBy, sortDirection, debouncedSearchQuery, currentPage]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBooks({
        category: selectedCategory || undefined,
        minRating: selectedRating > 0 ? selectedRating : undefined,
        currentlyReading: showCurrentlyReading ? true : undefined,
        title: debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : undefined,
        sortBy: sortOptionToApiField(sortBy),
        sortOrder: sortDirection,
        page: currentPage,
        limit: pageSize,
      });
      setBooks(response.items);
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

  const loadAllBooks = async () => {
    if (!allBooksLoaded) {
      try {
        const response = await fetchBooks({
          limit: 1000, // Get all books
        });
        setAllBooks(response.items);
        setAllBooksLoaded(true);
      } catch (error) {
        console.error('Error loading all books:', error);
        throw error;
      }
    }
  };

  const handleOpenChat = async () => {
    try {
      await loadAllBooks();
      setShowChatModal(true);
    } catch (error) {
      alert('Failed to load books. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      // Use cached books if available, otherwise fetch
      await loadAllBooks();

      // Create export data with timestamp
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalBooks: allBooks.length,
        books: allBooks,
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

      alert(`Successfully exported ${allBooks.length} books!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportComplete = async () => {
    // Reload books after import and invalidate cache
    setAllBooksLoaded(false);
    await loadBooks();
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

        {!isLoading && hasAnyBooks && (
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            bookCount={totalBooks}
            onSummaryClick={handleOpenChat}
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
          <>
            <BookList books={books} onUpdateBook={handleUpdateBook} />
            {totalBooks > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}

        {/* Book Chat Modal */}
        <BookChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          books={allBooks}
        />

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
