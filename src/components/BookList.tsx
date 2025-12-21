import { Book } from '@/types/book';
import BookItem from './BookItem';

interface BookListProps {
    books: Book[];
    onDeleteBook: (id: string) => void;
    onEditBook: (book: Book) => void;
}

export default function BookList({ books, onDeleteBook, onEditBook }: BookListProps) {
    if (books.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400">No books added yet.</p>;
    }

    return (
        <div className="space-y-4">
            {books.map((book) => (
                <BookItem key={book.id} book={book} onDelete={onDeleteBook} onEdit={onEditBook} />
            ))}
        </div>
    );
}