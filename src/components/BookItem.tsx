import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Book } from '@/types/book';
import StarRating from './StarRating';
import { getCategoryConfig } from '@/config/categories';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, memo } from 'react';

interface BookItemProps {
    book: Book;
    onUpdate?: (book: Book) => void;
}

export default memo(function BookItem({ book, onUpdate }: BookItemProps) {
    const router = useRouter();
    const [isReviewExpanded, setIsReviewExpanded] = useState(false);

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

    const hasOngoingDiscussion = book.conversation && book.conversation.length > 0;

    return (
        <div
            onClick={() => router.push(`/details/${book.id}`)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg h-full relative overflow-hidden flex flex-col cursor-pointer"
        >
            {/* Badges Container */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
                {book.currentlyReading && (
                    <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <span className="text-xs font-medium">Reading</span>
                    </div>
                )}
                {hasOngoingDiscussion && (
                    <div className="flex items-center gap-1.5 bg-linear-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full shadow-lg">
                        <MessageSquare size={14} />
                        <span className="text-xs font-medium">Chat</span>
                    </div>
                )}
            </div>

            <div className="flex gap-4 p-4">
                {book.image && (
                    <div className="shrink-0">
                        <Image
                            src={book.image}
                            alt={book.title}
                            width={112}
                            height={160}
                            className="w-28 h-40 object-cover rounded shadow-md"
                        />
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
                <div className="border-t border-gray-200 dark:border-gray-700 mt-auto">
                    <div
                        className={`px-4 py-3 text-gray-700 dark:text-gray-300 text-sm markdown-content transition-all ${isReviewExpanded ? 'max-h-none' : 'max-h-24 overflow-hidden'
                            }`}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {book.review}
                        </ReactMarkdown>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsReviewExpanded(!isReviewExpanded);
                        }}
                        className="w-full px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-700"
                    >
                        {isReviewExpanded ? (
                            <>
                                <ChevronUp size={14} />
                                <span>Show less</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} />
                                <span>Show more</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
});