'use client';

import { useState, useEffect } from 'react';
import AddBook from '@/components/AddBook';
import BookList from '@/components/BookList';
import ImportBooks from '@/components/ImportBooks';
import { Book } from '@/types/book';
import { fetchBooks, createBook, deleteBook as deleteBookApi } from '@/lib/api';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleAddBook = async (book: Book) => {
    try {
      const newBook = await createBook(book);
      setBooks([...books, newBook]);
    } catch (error) {
      console.error('Failed to add book:', error);
      alert('Failed to add book. Please try again.');
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBookApi(id);
      setBooks(books.filter(book => book.id !== id));
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  const handleImportBooks = async (importedBooks: Book[]) => {
    try {
      const promises = importedBooks.map(book => createBook(book));
      const newBooks = await Promise.all(promises);
      setBooks([...books, ...newBooks]);
    } catch (error) {
      console.error('Failed to import books:', error);
      alert('Failed to import books. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">My Book Tracker</h1>
        {isLoading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading books...</div>
        ) : (
          <>
            <ImportBooks onImport={handleImportBooks} />
            <div className="mb-8">
              <AddBook onAddBook={handleAddBook} />
            </div>
            <BookList books={books} onDeleteBook={handleDeleteBook} />
          </>
        )}
      </div>
    </div>
  );
}
