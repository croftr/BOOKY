'use client';

import { useState } from 'react';
import { Book } from '@/types/book';
import { importBooksFromJSON, ImportBook } from '@/lib/importBooks';

interface ImportBooksProps {
  onImport: (books: Book[]) => void;
  currentBooks: Book[];
}

export default function ImportBooks({ onImport, currentBooks }: ImportBooksProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const jsonData: ImportBook[] = JSON.parse(text);

      // Calculate next completion order
      const maxOrder = currentBooks.length > 0
        ? Math.max(...currentBooks.map(b => b.completionOrder || 0))
        : 0;
      const startOrder = maxOrder + 1;

      const importedBooks = importBooksFromJSON(jsonData, startOrder);
      onImport(importedBooks);
      alert(`Successfully imported ${importedBooks.length} books!`);
      // Reset the input
      e.target.value = '';
    } catch (error) {
      console.error('Error importing books:', error);
      alert('Error importing books. Please check the JSON file format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4">
      <div className="flex items-center gap-4">
        <label className="flex-1">
          <span className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Import Books from JSON
          </span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-green-500 file:text-white hover:file:bg-green-600 disabled:opacity-50"
          />
        </label>
        {isImporting && (
          <span className="text-gray-600 dark:text-gray-400">Importing...</span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Upload a JSON file containing your book collection. Books will be added to your existing collection.
      </p>
    </div>
  );
}
