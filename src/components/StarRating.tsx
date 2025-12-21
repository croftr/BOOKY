import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
}

export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 20,
  showLabel = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating:</span>}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`transition-all ${
                readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110'
              }`}
              aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={`transition-colors ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500'
                    : 'fill-none text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && rating === 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400">Not rated</span>
      )}
    </div>
  );
}
