import { useRouter } from 'next/navigation';
import { Book } from '@/types/book';
import StarRating from './StarRating';
import { getCategoryConfig } from '@/config/categories';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil } from 'lucide-react';

interface BookItemProps {
    book: Book;
    onUpdate?: (book: Book) => void;
}

export default function BookItem({ book, onUpdate }: BookItemProps) {
    const router = useRouter();

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();

        // Get ordinal suffix
        const getOrdinalSuffix = (n: number) => {
            const s = ['th', 'st', 'nd', 'rd'];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        };

        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    };

    const categoryConfig = getCategoryConfig(book.category);
    const CategoryIcon = categoryConfig?.icon;

    const handleRatingChange = (newRating: number) => {
        if (onUpdate) {
            const updatedBook = { ...book, rating: newRating };
            onUpdate(updatedBook);
        }
    };

    return (
        <div
            onClick={() => router.push(`/details/${book.id}`)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg h-full relative overflow-hidden flex flex-col cursor-pointer"
        >
            <div className="flex gap-4 p-4">
                {book.image && (
                    <div className="shrink-0">
                        <img src={book.image} alt={book.title} className="w-28 h-40 object-cover rounded shadow-md" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{book.title}</h3>

                    <div className="flex items-center gap-1.5 text-sm mb-2">
                        {CategoryIcon && (
                            <CategoryIcon size={16} className={categoryConfig.color} />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{book.category || 'Uncategorized'}</span>
                    </div>

                    <div className="mb-3">
                        <StarRating
                            rating={book.rating}
                            onChange={handleRatingChange}
                            readonly={!onUpdate}
                            size={18}
                            showLabel
                        />
                    </div>

                    <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Completed:</span> {formatDate(book.dateCompleted)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Order:</span> {book.completionOrder ? <span className="font-mono text-blue-600 dark:text-blue-400">#{book.completionOrder}</span> : 'Not set'}
                        </p>
                    </div>
                </div>
            </div>

            {book.review && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="text-gray-700 dark:text-gray-300 text-sm markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {book.review}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}