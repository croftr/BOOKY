'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Book } from '@/types/book';
import { fetchBook, updateBook, deleteBook as deleteBookApi, uploadImage } from '@/lib/api';
import CategorySelect from '@/components/CategorySelect';
import StarRating from '@/components/StarRating';
import ConfirmModal from '@/components/ConfirmModal';
import { Pencil, X, Save, Trash2, ArrowLeft } from 'lucide-react';
import { getCategoryConfig } from '@/config/categories';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BookDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.id as string;

    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
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
            const foundBook = await fetchBook(bookId);

            setBook(foundBook);
            setTitle(foundBook.title);
            setImagePreview(foundBook.image);
            setRating(foundBook.rating);
            setReview(foundBook.review);
            setCategory(foundBook.category);
            setDateCompleted(foundBook.dateCompleted);
            setCompletionOrder(foundBook.completionOrder || 1);
        } catch (error) {
            console.error('Failed to load book:', error);
            alert('Book not found');
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
            setBook(updatedBook);
            setImageFile(null);
            setIsEditMode(false);
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

    const handleCancelEdit = () => {
        if (!book) return;

        setTitle(book.title);
        setImagePreview(book.image);
        setRating(book.rating);
        setReview(book.review);
        setCategory(book.category);
        setDateCompleted(book.dateCompleted);
        setCompletionOrder(book.completionOrder || 1);
        setImageFile(null);
        setIsEditMode(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();

        const getOrdinalSuffix = (n: number) => {
            const s = ['th', 'st', 'nd', 'rd'];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        };

        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
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

    const categoryConfig = getCategoryConfig(book.category);
    const CategoryIcon = categoryConfig?.icon;

    return (
        <>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 px-4 md:py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 px-4 py-6 md:px-8">
                            <div className="flex items-start justify-between gap-4">
                                <button
                                    onClick={() => router.push('/')}
                                    className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Back to library"
                                >
                                    <ArrowLeft size={24} />
                                </button>

                                <h1 className="flex-1 text-2xl md:text-3xl font-bold text-white text-center px-4">
                                    {book.title}
                                </h1>

                                <div className="flex gap-2">
                                    {!isEditMode ? (
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            aria-label="Edit book"
                                        >
                                            <Pencil size={24} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            aria-label="Cancel editing"
                                        >
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {!isEditMode ? (
                            // Read-only view
                            <div className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Left column - Image */}
                                    <div className="md:col-span-1">
                                        {book.image && (
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full max-w-sm mx-auto rounded-lg shadow-lg object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Right column - Details */}
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Category */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Category
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {CategoryIcon && (
                                                    <CategoryIcon size={20} className={categoryConfig.color} />
                                                )}
                                                <span className="text-lg text-gray-900 dark:text-gray-100">
                                                    {book.category || 'Uncategorized'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Rating
                                            </h3>
                                            <StarRating
                                                rating={book.rating}
                                                onChange={() => {}}
                                                readonly={true}
                                                size={24}
                                                showLabel
                                            />
                                        </div>

                                        {/* Date Completed */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Date Completed
                                            </h3>
                                            <p className="text-lg text-gray-900 dark:text-gray-100">
                                                {formatDate(book.dateCompleted)}
                                            </p>
                                        </div>

                                        {/* Completion Order */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Completion Order
                                            </h3>
                                            <p className="text-lg font-mono text-blue-600 dark:text-blue-400">
                                                #{book.completionOrder}
                                            </p>
                                        </div>

                                        {/* Review */}
                                        {book.review && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                                    Review
                                                </h3>
                                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 markdown-content">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {book.review}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Edit mode
                            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Left column - Image */}
                                    <div className="md:col-span-1 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Book Cover Image
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                                            />
                                        </div>
                                        {imagePreview && (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full max-w-sm mx-auto rounded-lg shadow-lg object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Right column - Form fields */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Category
                                            </label>
                                            <CategorySelect
                                                value={category}
                                                onChange={setCategory}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Rating
                                            </label>
                                            <StarRating
                                                rating={rating}
                                                onChange={setRating}
                                                size={28}
                                                showLabel
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Date Completed
                                            </label>
                                            <input
                                                type="date"
                                                value={dateCompleted}
                                                onChange={(e) => setDateCompleted(e.target.value)}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Completion Order
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={completionOrder}
                                                onChange={(e) => setCompletionOrder(Number(e.target.value))}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Controls the order books are displayed (lower numbers appear first)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                Review
                                            </label>
                                            <textarea
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                rows={8}
                                                placeholder="What did you think of this book? (Supports Markdown formatting)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        <Save size={20} />
                                        {isUploading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <Trash2 size={20} />
                                        Delete
                                    </button>
                                </div>
                            </form>
                        )}
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
