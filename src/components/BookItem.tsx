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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-shadow hover:shadow-lg h-full relative">
            <button
                onClick={() => router.push(`/edit/${book.id}`)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
                aria-label="Edit book"
                title="Edit book"
            >
                <Pencil size={18} />
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 pr-10">{book.title}</h3>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                {book.image && (
                    <img src={book.image} alt={book.title} className="w-24 h-36 object-cover rounded shrink-0 shadow-sm" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm mt-1">
                        {CategoryIcon && (
                            <CategoryIcon size={16} className={categoryConfig.color} />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{book.category || 'Uncategorized'}</span>
                    </div>
                    <div className="mt-2">
                        <StarRating
                            rating={book.rating}
                            onChange={handleRatingChange}
                            readonly={!onUpdate}
                            size={18}
                            showLabel
                        />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Completion Order: {book.completionOrder ? <span className="font-mono text-blue-600 dark:text-blue-400">#{book.completionOrder}</span> : 'Not set'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Completed: {formatDate(book.dateCompleted)}
                    </p>
                    {book.review && (
                        <div className="mt-3 text-gray-700 dark:text-gray-300 text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3 markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {book.review}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}