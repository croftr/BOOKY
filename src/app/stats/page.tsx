'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/types/book';
import { fetchBooks } from '@/lib/api';
import { TrendingUp, Calendar, Award, BookOpen, Clock, Star, ArrowLeft } from 'lucide-react';

interface MonthlyStats {
  month: string;
  count: number;
  avgRating: number;
}

interface CategoryStats {
  category: string;
  count: number;
  avgRating: number;
}

export default function StatsPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBooks({ limit: 1000 });
      setBooks(response.items);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const booksWithDates = books.filter(b => b.dateCompleted);
  const totalBooks = books.length;
  const booksRead = booksWithDates.length;
  const avgRating = books.length > 0
    ? (books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length).toFixed(1)
    : '0.0';

  // Books per month
  const monthlyStats: MonthlyStats[] = (() => {
    const months: { [key: string]: { count: number; totalRating: number } } = {};

    booksWithDates.forEach(book => {
      if (!book.dateCompleted) return;
      const date = new Date(book.dateCompleted);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[monthKey]) {
        months[monthKey] = { count: 0, totalRating: 0 };
      }
      months[monthKey].count++;
      months[monthKey].totalRating += book.rating || 0;
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        count: data.count,
        avgRating: data.count > 0 ? data.totalRating / data.count : 0
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);
  })();

  // Books per year
  const yearlyStats = (() => {
    const years: { [key: string]: number } = {};

    booksWithDates.forEach(book => {
      if (!book.dateCompleted) return;
      const year = new Date(book.dateCompleted).getFullYear().toString();
      years[year] = (years[year] || 0) + 1;
    });

    return Object.entries(years)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year.localeCompare(a.year));
  })();

  // Category stats
  const categoryStats: CategoryStats[] = (() => {
    const categories: { [key: string]: { count: number; totalRating: number } } = {};

    books.forEach(book => {
      const category = book.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { count: 0, totalRating: 0 };
      }
      categories[category].count++;
      categories[category].totalRating += book.rating || 0;
    });

    return Object.entries(categories)
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgRating: data.count > 0 ? data.totalRating / data.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  })();

  // Reading streak (consecutive months with at least one book)
  const readingStreak = (() => {
    if (booksWithDates.length === 0) return 0;

    const monthsWithBooks = new Set(
      booksWithDates.map(book => {
        const date = new Date(book.dateCompleted!);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    );

    const sortedMonths = Array.from(monthsWithBooks).sort().reverse();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let streak = 0;
    let checkMonth = currentMonth;

    while (sortedMonths.includes(checkMonth)) {
      streak++;
      const [year, month] = checkMonth.split('-').map(Number);
      const prevMonth = new Date(year, month - 2, 1);
      checkMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    }

    return streak;
  })();

  // Days since last book
  const daysSinceLastBook = (() => {
    if (booksWithDates.length === 0) return null;

    const sortedDates = booksWithDates
      .map(b => new Date(b.dateCompleted!))
      .sort((a, b) => b.getTime() - a.getTime());

    const lastDate = sortedDates[0];
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  })();

  // Most productive month
  const mostProductiveMonth = monthlyStats.length > 0
    ? monthlyStats.reduce((max, stat) => stat.count > max.count ? stat : max, monthlyStats[0])
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Back to library"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reading Statistics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Insights into your reading journey</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Books</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalBooks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{booksRead} with completion dates</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-yellow-600 dark:text-yellow-400" size={24} />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{avgRating}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">out of 5 stars</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Reading Streak</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{readingStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">consecutive months</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-purple-600 dark:text-purple-400" size={24} />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Book</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {daysSinceLastBook !== null ? daysSinceLastBook : '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {daysSinceLastBook !== null ? 'days ago' : 'no completion dates'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Reading */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Books Per Month</h2>
            </div>
            {monthlyStats.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const maxCount = monthlyStats.reduce((max, s) => Math.max(max, s.count), 0);
                  return monthlyStats.map(stat => {
                    const [year, month] = stat.month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    const barWidth = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                    return (
                      <div key={stat.month}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{monthName}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {stat.count} {stat.count === 1 ? 'book' : 'books'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No completion dates recorded yet.</p>
            )}
          </div>

          {/* Yearly Reading */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-green-600 dark:text-green-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Books Per Year</h2>
            </div>
            {yearlyStats.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const maxCount = yearlyStats.reduce((max, s) => Math.max(max, s.count), 0);
                  return yearlyStats.map(stat => {
                    const barWidth = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                    return (
                      <div key={stat.year}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{stat.year}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {stat.count} {stat.count === 1 ? 'book' : 'books'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No completion dates recorded yet.</p>
            )}
          </div>

          {/* Category Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-purple-600 dark:text-purple-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reading by Category</h2>
            </div>
            {categoryStats.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const maxCount = categoryStats.reduce((max, s) => Math.max(max, s.count), 0);
                  return categoryStats.map(stat => {
                    const barWidth = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                    return (
                      <div key={stat.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{stat.category}</span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              ⭐ {stat.avgRating.toFixed(1)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {stat.count}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No books added yet.</p>
            )}
          </div>

          {/* Most Productive Month */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reading Highlights</h2>
            </div>
            <div className="space-y-4">
              {mostProductiveMonth && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Most Productive Month</h3>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {new Date(mostProductiveMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {mostProductiveMonth.count} books completed
                  </p>
                </div>
              )}

              {categoryStats.length > 0 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Favorite Category</h3>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {categoryStats[0].category}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {categoryStats[0].count} books · ⭐ {categoryStats[0].avgRating.toFixed(1)} avg
                  </p>
                </div>
              )}

              {books.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Highest Rated Books</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {books.filter(b => b.rating === 5).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Five-star reads
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
