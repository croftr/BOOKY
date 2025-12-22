import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Search, ChevronDown } from 'lucide-react';
import { CATEGORIES, getCategoryConfig } from '@/config/categories';

export type SortOption = 'completion' | 'title' | 'rating' | 'date';

interface ToolbarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedRating: number;
  onRatingChange: (rating: number) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  bookCount: number;
}

export default function Toolbar({
  selectedCategory,
  onCategoryChange,
  selectedRating,
  onRatingChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  bookCount,
}: ToolbarProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategoryConfig = getCategoryConfig(selectedCategory);
  const SelectedCategoryIcon = selectedCategoryConfig?.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Book Count */}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </span>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 min-w-0">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search books by title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-0 lg:max-w-[200px]" ref={categoryDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              {SelectedCategoryIcon && (
                <SelectedCategoryIcon size={16} className={selectedCategoryConfig.color} />
              )}
              <span>{selectedCategory ? selectedCategoryConfig?.label : 'All Categories'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCategoryOpen && (
            <div className="absolute z-20 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto w-[200px]">
              <button
                type="button"
                onClick={() => {
                  onCategoryChange('');
                  setIsCategoryOpen(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-900 dark:text-gray-100 ${!selectedCategory ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => {
                const CategoryIcon = cat.icon;
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onCategoryChange(cat.value);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                  >
                    <CategoryIcon size={16} className={cat.color} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="flex-1 min-w-0 lg:max-w-[180px]">
          <select
            id="rating"
            value={selectedRating}
            onChange={(e) => onRatingChange(Number(e.target.value))}
            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>All Ratings</option>
            <option value={1}>1+ ⭐</option>
            <option value={2}>2+ ⭐</option>
            <option value={3}>3+ ⭐</option>
            <option value={4}>4+ ⭐</option>
            <option value={5}>5 ⭐</option>
          </select>
        </div>

        {/* Sort Section */}
        <div className="flex gap-2 items-center flex-1 min-w-0 lg:max-w-[220px]">
          {/* <ArrowUpDown size={18} className="text-gray-600 dark:text-gray-400 flex-shrink-0" /> */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="flex-1 pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completion">Sort by Completion Order</option>
            <option value="title">Sort by  Title (A-Z)</option>
            <option value="rating">Sort by  Rating (High to Low)</option>
            <option value="date">Sort by Date Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
