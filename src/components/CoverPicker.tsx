'use client';

import { useState, useEffect } from 'react';
import { fetchBookCovers, BookCover } from '@/lib/api';
import { Search, Upload, Loader2, X } from 'lucide-react';

interface CoverPickerProps {
  bookTitle: string;
  onSelectCover: (url: string) => void;
  onUploadFile: (file: File) => void;
  currentPreview?: string;
}

export default function CoverPicker({ bookTitle, onSelectCover, onUploadFile, currentPreview }: CoverPickerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [covers, setCovers] = useState<BookCover[]>([]);
  const [selectedCoverId, setSelectedCoverId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-search when book title is provided
  useEffect(() => {
    if (bookTitle && bookTitle.length >= 3) {
      setSearchQuery(bookTitle);
    }
  }, [bookTitle]);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      alert('Please enter at least 3 characters');
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const result = await fetchBookCovers(searchQuery);
      setCovers(result.covers);
      if (result.covers.length === 0) {
        alert('No covers found. Try a different search term or upload your own image.');
      }
    } catch (error) {
      console.error('Failed to fetch covers:', error);
      alert('Failed to fetch covers. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCover = (cover: BookCover) => {
    setSelectedCoverId(cover.id);
    // Use the largest available size
    const imageUrl = cover.sizes.large || cover.sizes.medium || cover.url;
    onSelectCover(imageUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      setSelectedCoverId(null);
      setShowResults(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for book cover (e.g., book title)"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isSearching ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search Covers
              </>
            )}
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
            <Upload size={18} />
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {currentPreview && !showResults && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Cover:</div>
          <img
            src={currentPreview}
            alt="Current cover"
            className="w-32 h-48 object-cover rounded shadow-md"
          />
        </div>
      )}

      {showResults && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {covers.length > 0 ? `Found ${covers.length} covers:` : 'No covers found'}
            </div>
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded">
            {covers.map((cover) => (
              <div
                key={cover.id}
                className={`cursor-pointer transition-all ${
                  selectedCoverId === cover.id
                    ? 'ring-4 ring-blue-500 scale-105'
                    : 'hover:ring-2 hover:ring-gray-400'
                } rounded overflow-hidden`}
                onClick={() => handleSelectCover(cover)}
                title={`${cover.title} by ${cover.authors}`}
              >
                <img
                  src={cover.url}
                  alt={cover.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-1 bg-white dark:bg-gray-800 text-xs">
                  <div className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {cover.title}
                  </div>
                  <div className="truncate text-gray-600 dark:text-gray-400">
                    {cover.authors}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
