import { Book } from '@/types/book';

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

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex gap-4">
            {book.image && (
                <img src={book.image} alt={book.title} className="w-24 h-36 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{book.title}</h3>

                </div>
                <p className="text-yellow-500 dark:text-yellow-400">Rating: {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
                <p className="text-gray-600 dark:text-gray-400">Category: {book.category || 'Uncategorized'}</p>
                <p className="text-gray-600 dark:text-gray-400">
                    Completion Order: {book.completionOrder ? `${book.completionOrder}` : 'Not set'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                    Completed: {formatDate(book.dateCompleted)}
                </p>
                {book.review && <p className="mt-2 text-gray-700 dark:text-gray-300">{book.review}</p>}
            </div>
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onEdit(book)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex-shrink-0"
                    aria-label="Edit book"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(book.id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex-shrink-0"
                    aria-label="Delete book"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}