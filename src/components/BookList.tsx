import { Book } from '@/types/book';
import BookItem from './BookItem';

interface BookListProps {
    books: Book[];
    onDeleteBook: (id: string) => void;
    onEditBook: (book: Book) => void;
    onUpdateBook?: (book: Book) => void;
}

export default function BookList({ books, onDeleteBook, onEditBook, onUpdateBook }: BookListProps) {
    if (books.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400">No books added yet.</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {books.map((book) => (
                <BookItem key={book.id} book={book} onDelete={onDeleteBook} onEdit={onEditBook} onUpdate={onUpdateBook} />
            ))}
        </div>
    );
}