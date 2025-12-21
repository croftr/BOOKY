import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, getCategoryConfig } from '@/config/categories';
import { ChevronDown } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function CategorySelect({ value, onChange, required = false, className = '' }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = getCategoryConfig(value);
  const SelectedIcon = selectedCategory?.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (categoryValue: string) => {
    onChange(categoryValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-between gap-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${
          !value && required ? 'text-gray-500 dark:text-gray-400' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {SelectedIcon && (
            <SelectedIcon size={18} className={selectedCategory.color} />
          )}
          <span>{value ? selectedCategory?.label : 'Select a category'}</span>
        </div>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-auto">
          {!required && (
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-500 dark:text-gray-400"
            >
              Select a category
            </button>
          )}
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isSelected = value === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => handleSelect(category.value)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-900 dark:text-gray-100 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <IconComponent size={18} className={category.color} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
