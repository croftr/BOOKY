'use client';

import { useState, useRef } from 'react';
import { Book } from '@/types/book';
import { bulkCreateBooks, fetchBooks } from '@/lib/api';
import { validateImportData, parseImportFile, ValidationResult, ImportBook } from '@/lib/importValidation';
import { X, Upload, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type Step = 'upload' | 'validate' | 'confirm' | 'importing' | 'complete';

export default function ImportDataModal({ isOpen, onClose, onImportComplete }: ImportDataModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        setError('Please select a valid JSON file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    try {
      setError(null);
      setStep('validate');

      const fileContent = await file.text();
      const importData = parseImportFile(fileContent);

      // Fetch existing books to check for duplicates
      const existingBooksResponse = await fetchBooks({ limit: 1000 });
      const existingBooks = existingBooksResponse.items;

      const result = validateImportData(importData, existingBooks);
      setValidationResult(result);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate file');
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    try {
      setError(null);
      setStep('importing');
      setImportProgress({ current: 0, total: validationResult.valid.length });

      // Get the highest completion order
      const existingBooksResponse = await fetchBooks({ limit: 1000 });
      const existingBooks = existingBooksResponse.items;
      const maxCompletionOrder = existingBooks.reduce(
        (max, book) => Math.max(max, book.completionOrder || 0),
        0
      );

      // Prepare all books for bulk import
      const booksToImport: Book[] = validationResult.valid.map((bookToImport, i) => {
        // Always assign new completionOrder values
        const completionOrder = maxCompletionOrder + i + 1;

        // Create a new book with required fields
        return {
          id: bookToImport.id || `${Date.now()}-${i}`,
          title: bookToImport.title!,
          category: bookToImport.category!,
          rating: bookToImport.rating ?? 0,
          review: bookToImport.review ?? '',
          image: bookToImport.image ?? '',
          dateCompleted: bookToImport.dateCompleted ?? '',
          completionOrder,
          externalLinks: bookToImport.externalLinks ?? [],
          reviewImages: bookToImport.reviewImages ?? [],
          currentlyReading: bookToImport.currentlyReading ?? false,
        };
      });

      // Bulk import all books at once
      await bulkCreateBooks(booksToImport);
      setImportProgress({ current: booksToImport.length, total: booksToImport.length });

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import books');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    if (step === 'complete') {
      onImportComplete();
    }
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setError(null);
    setImportProgress({ current: 0, total: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Import Books
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Upload size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select Import File</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose a JSON file exported from this application
                </p>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'Click to select a file or drag and drop'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Validating */}
          {step === 'validate' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Validating import file...</p>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && validationResult && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Validation Results</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review the books that will be imported
                </p>
              </div>

              {/* Valid Books */}
              {validationResult.valid.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      Valid Books ({validationResult.valid.length})
                    </h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {validationResult.valid.map((book, index) => (
                      <div key={index} className="text-sm text-green-800 dark:text-green-200 pl-8">
                        • {book.title} - {book.category}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Books */}
              {validationResult.duplicates.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Duplicate Titles ({validationResult.duplicates.length})
                    </h4>
                  </div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    These books already exist and will be skipped:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationResult.duplicates.map((item, index) => (
                      <div key={index} className="text-sm text-yellow-800 dark:text-yellow-200 pl-8">
                        • {item.book.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Books */}
              {validationResult.invalid.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="text-red-600 dark:text-red-400" size={24} />
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Invalid Books ({validationResult.invalid.length})
                    </h4>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    These books have validation errors and will be skipped:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {validationResult.invalid.map((item, index) => (
                      <div key={index} className="text-sm text-red-800 dark:text-red-200 pl-8">
                        • {item.book.title || '(No title)'} - {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Importing books...</p>
              <p className="text-gray-500 dark:text-gray-500">
                {importProgress.current} of {importProgress.total}
              </p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Successfully imported {validationResult?.valid.length} books
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {step === 'complete' ? 'Close' : 'Cancel'}
          </button>

          {step === 'upload' && (
            <button
              onClick={handleValidate}
              disabled={!file}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Validate File
            </button>
          )}

          {step === 'confirm' && validationResult && validationResult.valid.length > 0 && (
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Import {validationResult.valid.length} Books
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
