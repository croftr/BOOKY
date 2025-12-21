'use client';

import { useState, useEffect } from 'react';
import AddBook from '@/components/AddBook';
import BookList from '@/components/BookList';
import EditBook from '@/components/EditBook';
import { Book } from '@/types/book';
import { fetchBooks, createBook, deleteBook as deleteBookApi, updateBook } from '@/lib/api';

import { CirclePlus } from 'lucide-react';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);

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
      await createBook(book);
      // Reload books to capture any reordering done by the backend
      loadBooks();
      setShowAddBook(false);
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

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
  };

  const handleSaveEdit = async (updatedBook: Book) => {
    try {
      await updateBook(updatedBook.id, updatedBook);
      setBooks(books.map(book => book.id === updatedBook.id ? updatedBook : book));
      setEditingBook(null);
    } catch (error) {
      console.error('Failed to update book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8 justify-center gap-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Book Tracker</h1>


          <button
            onClick={() => setShowAddBook(true)}
            className="p-2 bg-blue-600 text-white rounded-4xl font-medium shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <CirclePlus size={20} />
          </button>
        </div>

        {showAddBook && (
          <AddBook
            onAddBook={handleAddBook}
            onCancel={() => setShowAddBook(false)}
            currentBooks={books}
          />
        )}

        {isLoading ? (
          <div className="text-center text-gray-600 dark:text-gray-400">Loading books...</div>
        ) : (
          <BookList books={[...books].sort((a, b) => (a.completionOrder || 0) - (b.completionOrder || 0))} onDeleteBook={handleDeleteBook} onEditBook={handleEditBook} />
        )}
      </div>

      {editingBook && (
        <EditBook
          book={editingBook}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
