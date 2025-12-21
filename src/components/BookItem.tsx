import { Book } from '@/types/book';

interface BookItemProps {
    book: Book;
    onDelete: (id: string) => void;
}

export default function BookItem({ book, onDelete }: BookItemProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex gap-4">
            {book.image && (
                <img src={book.image} alt={book.title} className="w-24 h-36 object-cover rounded flex-shrink-0" />
            )}
            <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{book.title}</h3>
                <p className="text-yellow-500 dark:text-yellow-400">Rating: {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
                <p className="text-gray-600 dark:text-gray-400">Category: {book.category || 'Uncategorized'}</p>
                <p className="text-gray-600 dark:text-gray-400">Completed: {new Date(book.dateCompleted).toLocaleDateString()}</p>
                {book.review && <p className="mt-2 text-gray-700 dark:text-gray-300">{book.review}</p>}
            </div>
            <button
                onClick={() => onDelete(book.id)}
                className="self-start px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex-shrink-0"
                aria-label="Delete book"
            >
                Delete
            </button>
        </div>
    );
}