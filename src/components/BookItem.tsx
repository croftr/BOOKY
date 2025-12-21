import { useState } from 'react';
import { Book } from '@/types/book';
import ConfirmModal from './ConfirmModal';
import { getCategoryConfig } from '@/config/categories';

interface BookItemProps {
    book: Book;
    onDelete: (id: string) => void;
    onEdit: (book: Book) => void;
}

export default function BookItem({ book, onDelete, onEdit }: BookItemProps) {
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

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const categoryConfig = getCategoryConfig(book.category);
    const CategoryIcon = categoryConfig?.icon;

    return (
        <>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex gap-4 transition-shadow hover:shadow-lg h-full">
                {book.image && (
                    <img src={book.image} alt={book.title} className="w-24 h-36 object-cover rounded flex-shrink-0 shadow-sm" />
                )}
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{book.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm mt-1">
                        {CategoryIcon && (
                            <CategoryIcon size={16} className={categoryConfig.color} />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{book.category || 'Uncategorized'}</span>
                    </div>
                    <p className="text-yellow-500 dark:text-yellow-400 font-medium">Rating: {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Completion Order: {book.completionOrder ? <span className="font-mono text-blue-600 dark:text-blue-400">#{book.completionOrder}</span> : 'Not set'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Completed: {formatDate(book.dateCompleted)}
                    </p>
                    {book.review && <p className="mt-3 text-gray-700 dark:text-gray-300 italic text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3">{book.review}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(book)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex-shrink-0 transition-colors shadow-sm"
                        aria-label="Edit book"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex-shrink-0 transition-colors shadow-sm"
                        aria-label="Delete book"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Book"
                message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
                onConfirm={() => {
                    onDelete(book.id);
                    setShowDeleteConfirm(false);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}