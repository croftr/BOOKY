'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Book, ConversationMessage } from '@/types/book';
import { fetchBook, updateBook, deleteBook as deleteBookApi, uploadImage } from '@/lib/api';
import CategorySelect from '@/components/CategorySelect';
import StarRating from '@/components/StarRating';
import ConfirmModal from '@/components/ConfirmModal';
import { Pencil, X, Save, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
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
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string>('');
    const [userInput, setUserInput] = useState<string>('');

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
            setConversation(foundBook.conversation || []);
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

    const handleStartDiscussion = async () => {
        if (!book) return;

        setIsGeneratingSummary(true);
        setSummaryError('');

        try {
            const response = await fetch(`/api/books/${book.id}/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: book.title,
                    category: book.category,
                    review: book.review,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate response');
            }

            const data = await response.json();

            const newMessage: ConversationMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString(),
            };

            const updatedConversation = [newMessage];
            setConversation(updatedConversation);

            // Update the book with the new conversation
            const updatedBook: Book = {
                ...book,
                conversation: updatedConversation,
            };
            await updateBook(book.id, updatedBook);
            setBook(updatedBook);
        } catch (error) {
            console.error('Error generating response:', error);
            setSummaryError('Failed to generate response. Please try again.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSendMessage = async () => {
        if (!book || !userInput.trim()) return;

        setIsGeneratingSummary(true);
        setSummaryError('');

        const userMessage: ConversationMessage = {
            role: 'user',
            content: userInput.trim(),
            timestamp: new Date().toISOString(),
        };

        const updatedConversation = [...conversation, userMessage];
        setConversation(updatedConversation);
        setUserInput('');

        try {
            const response = await fetch(`/api/books/${book.id}/summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: book.title,
                    category: book.category,
                    review: book.review,
                    userMessage: userInput.trim(),
                    conversationHistory: updatedConversation,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate response');
            }

            const data = await response.json();

            const aiMessage: ConversationMessage = {
                role: 'assistant',
                content: data.message,
                timestamp: new Date().toISOString(),
            };

            const finalConversation = [...updatedConversation, aiMessage];
            setConversation(finalConversation);

            // Update the book with the new conversation
            const updatedBook: Book = {
                ...book,
                conversation: finalConversation,
            };
            await updateBook(book.id, updatedBook);
            setBook(updatedBook);
        } catch (error) {
            console.error('Error generating response:', error);
            setSummaryError('Failed to generate response. Please try again.');
            // Remove the user message if AI failed
            setConversation(conversation);
        } finally {
            setIsGeneratingSummary(false);
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
                        <div className="bg-linear-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 px-4 py-6 md:px-8">
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
                                                onChange={() => { }}
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

                                        {/* AI Discussion */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-16">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Book Discussion
                                                </h3>
                                                {conversation.length === 0 && (
                                                    <button
                                                        onClick={handleStartDiscussion}
                                                        disabled={isGeneratingSummary}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg"
                                                    >
                                                        <Sparkles size={16} />
                                                        {isGeneratingSummary ? 'Starting...' : 'Discuss Book'}
                                                    </button>
                                                )}
                                            </div>
                                            {summaryError && (
                                                <div className="text-red-500 dark:text-red-400 text-sm mb-3">
                                                    {summaryError}
                                                </div>
                                            )}
                                            {conversation.length > 0 ? (
                                                <div className="space-y-4">
                                                    {/* Conversation Messages */}
                                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                                        {conversation.map((message, index) => (
                                                            <div
                                                                key={index}
                                                                className={`p-4 rounded-lg ${message.role === 'assistant'
                                                                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700'
                                                                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                                                        {message.role === 'assistant' ? 'AI' : 'You'}
                                                                    </span>
                                                                </div>
                                                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm">
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {message.content}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* User Input */}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={userInput}
                                                            onChange={(e) => setUserInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && !isGeneratingSummary && handleSendMessage()}
                                                            placeholder="Continue the discussion..."
                                                            disabled={isGeneratingSummary}
                                                            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50"
                                                        />
                                                        <button
                                                            onClick={handleSendMessage}
                                                            disabled={isGeneratingSummary || !userInput.trim()}
                                                            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg"
                                                        >
                                                            {isGeneratingSummary ? '...' : 'Send'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                                                    Click "Discuss Book" to start a conversation about this book.
                                                </p>
                                            )}
                                        </div>
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
