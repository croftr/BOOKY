'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Book } from '@/types/book';
import { fetchBooks, updateBook, deleteBook as deleteBookApi, uploadImage } from '@/lib/api';
import CategorySelect from '@/components/CategorySelect';
import StarRating from '@/components/StarRating';
import ConfirmModal from '@/components/ConfirmModal';

export default function EditBookPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.id as string;

    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [category, setCategory] = useState('');
    const [dateCompleted, setDateCompleted] = useState('');
    const [completionOrder, setCompletionOrder] = useState(1);

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        try {
            setIsLoading(true);
            const books = await fetchBooks();
            const foundBook = books.find(b => b.id === bookId);

            if (foundBook) {
                setBook(foundBook);
                setTitle(foundBook.title);
                setImagePreview(foundBook.image);
                setRating(foundBook.rating);
                setReview(foundBook.review);
                setCategory(foundBook.category);
                setDateCompleted(foundBook.dateCompleted);
                setCompletionOrder(foundBook.completionOrder || 1);
            } else {
                alert('Book not found');
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to load book:', error);
            alert('Failed to load book');
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book) return;

        setIsUploading(true);

        try {
            let imageUrl = book.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const updatedBook: Book = {
                ...book,
                title,
                image: imageUrl,
                rating,
                review,
                category,
                dateCompleted,
                completionOrder,
            };

            await updateBook(book.id, updatedBook);
            router.push('/');
        } catch (error) {
            console.error('Error updating book:', error);
            alert('Failed to update book. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!book) return;

        try {
            await deleteBookApi(book.id);
            router.push('/');
        } catch (error) {
            console.error('Failed to delete book:', error);
            alert('Failed to delete book. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading book...</div>
            </div>
        );
    }

    if (!book) {
        return null;
    }

    return (
        <>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Book</h1>
                            <button
                                onClick={() => router.push('/')}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Book Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                />
                                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-48 object-cover rounded" />}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rating</label>
                                <StarRating
                                    rating={rating}
                                    onChange={setRating}
                                    size={24}
                                    showLabel
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Review</label>
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    rows={4}
                                    placeholder="What did you think of this book? (Supports Markdown formatting)"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                                <CategorySelect
                                    value={category}
                                    onChange={setCategory}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date Completed (Optional)</label>
                                <input
                                    type="date"
                                    value={dateCompleted}
                                    onChange={(e) => setDateCompleted(e.target.value)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Completion Order</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={completionOrder}
                                    onChange={(e) => setCompletionOrder(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls the order books are displayed (lower numbers appear first)</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isUploading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Book"
                message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </>
    );
}
