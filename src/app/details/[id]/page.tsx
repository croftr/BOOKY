'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Book, ConversationMessage, ExternalLink, GoogleBooksInfo } from '@/types/book';
import { fetchBook, updateBook, deleteBook as deleteBookApi, uploadImage } from '@/lib/api';
import CategorySelect from '@/components/CategorySelect';
import StarRating from '@/components/StarRating';
import ConfirmModal from '@/components/ConfirmModal';
import { Pencil, X, Save, Trash2, ArrowLeft, Sparkles, ExternalLink as ExternalLinkIcon, Youtube, FileText, Link as LinkIcon, Plus, Book as BookIcon } from 'lucide-react';
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
    const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
    const [googleBooksInfo, setGoogleBooksInfo] = useState<GoogleBooksInfo | null>(null);
    const [isLoadingGoogleBooks, setIsLoadingGoogleBooks] = useState(false);

    // New link form state
    const [newLinkType, setNewLinkType] = useState<'youtube' | 'review' | 'article' | 'other'>('youtube');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkDescription, setNewLinkDescription] = useState('');

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
            setExternalLinks(foundBook.externalLinks || []);
            setGoogleBooksInfo(foundBook.googleBooksInfo || null);
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
                externalLinks,
                googleBooksInfo: googleBooksInfo || undefined,
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

    const handleFetchGoogleBooks = async () => {
        if (!book) return;

        setIsLoadingGoogleBooks(true);
        try {
            const response = await fetch(`/api/books/google?q=${encodeURIComponent(book.title)}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();

            if (data.found) {
                setGoogleBooksInfo(data.info);

                // Save to book
                const updatedBook: Book = {
                    ...book,
                    googleBooksInfo: data.info,
                };
                await updateBook(book.id, updatedBook);
                setBook(updatedBook);
            } else {
                alert('No information found on Google Books for this title.');
            }
        } catch (error) {
            console.error('Error fetching Google Books:', error);
            alert('Failed to fetch Google Books information.');
        } finally {
            setIsLoadingGoogleBooks(false);
        }
    };

    const handleAddLink = () => {
        if (!newLinkUrl || !newLinkTitle) {
            alert('Please provide both URL and title');
            return;
        }

        const newLink: ExternalLink = {
            id: Date.now().toString(),
            type: newLinkType,
            url: newLinkUrl,
            title: newLinkTitle,
            description: newLinkDescription || undefined,
        };

        setExternalLinks([...externalLinks, newLink]);
        setNewLinkUrl('');
        setNewLinkTitle('');
        setNewLinkDescription('');
    };

    const handleRemoveLink = (linkId: string) => {
        setExternalLinks(externalLinks.filter(link => link.id !== linkId));
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
        setExternalLinks(book.externalLinks || []);
        setImageFile(null);
        setIsEditMode(false);
    };

    const getLinkIcon = (type: string) => {
        switch (type) {
            case 'youtube':
                return Youtube;
            case 'review':
                return FileText;
            case 'article':
                return FileText;
            default:
                return LinkIcon;
        }
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

                                        {/* Google Books Information */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Google Books Information
                                                </h3>
                                                {!googleBooksInfo && (
                                                    <button
                                                        onClick={handleFetchGoogleBooks}
                                                        disabled={isLoadingGoogleBooks}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                    >
                                                        <BookIcon size={14} />
                                                        {isLoadingGoogleBooks ? 'Loading...' : 'Fetch Info'}
                                                    </button>
                                                )}
                                            </div>
                                            {googleBooksInfo ? (
                                                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                                    {googleBooksInfo.authors && googleBooksInfo.authors.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Authors</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                                {googleBooksInfo.authors.join(', ')}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {googleBooksInfo.publisher && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Publisher</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                                {googleBooksInfo.publisher}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {googleBooksInfo.publishedDate && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Published Date</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                                {googleBooksInfo.publishedDate}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {googleBooksInfo.pageCount && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Page Count</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                                {googleBooksInfo.pageCount} pages
                                                            </p>
                                                        </div>
                                                    )}
                                                    {googleBooksInfo.description && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                                                                {googleBooksInfo.description}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2 pt-2">
                                                        {googleBooksInfo.previewLink && (
                                                            <a
                                                                href={googleBooksInfo.previewLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                                                            >
                                                                <ExternalLinkIcon size={12} />
                                                                Preview
                                                            </a>
                                                        )}
                                                        {googleBooksInfo.infoLink && (
                                                            <a
                                                                href={googleBooksInfo.infoLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                                                            >
                                                                <ExternalLinkIcon size={12} />
                                                                More Info
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    No Google Books information loaded yet.
                                                </p>
                                            )}
                                        </div>

                                        {/* External Links */}
                                        {externalLinks.length > 0 && (
                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">

                                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                                    External Links
                                                </h3>

                                                <div className="space-y-2">
                                                    {externalLinks.map((link) => {
                                                        const Icon = getLinkIcon(link.type);
                                                        return (
                                                            <a
                                                                key={link.id}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                                            >
                                                                <Icon size={18} className="text-gray-600 dark:text-gray-400 mt-0.5 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                        {link.title}
                                                                    </p>
                                                                    {link.description && (
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                                            {link.description}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                                                        {link.url}
                                                                    </p>
                                                                </div>
                                                                <ExternalLinkIcon size={14} className="text-gray-400 dark:text-gray-500 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </a>
                                                        );
                                                    })}
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
                                                        className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg"
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
                                                                    ? 'bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700'
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
                                                            className="px-4 py-3 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg"
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

                                        {/* External Links Management */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                                External Links
                                            </h3>

                                            {/* Add New Link Form */}
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                                                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Add New Link</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Type
                                                        </label>
                                                        <select
                                                            value={newLinkType}
                                                            onChange={(e) => setNewLinkType(e.target.value as 'youtube' | 'review' | 'article' | 'other')}
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                        >
                                                            <option value="youtube">YouTube Video</option>
                                                            <option value="review">Review</option>
                                                            <option value="article">Article</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Title
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newLinkTitle}
                                                            onChange={(e) => setNewLinkTitle(e.target.value)}
                                                            placeholder="Link title"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={newLinkUrl}
                                                            onChange={(e) => setNewLinkUrl(e.target.value)}
                                                            placeholder="https://..."
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                            Description (optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newLinkDescription}
                                                            onChange={(e) => setNewLinkDescription(e.target.value)}
                                                            placeholder="Brief description"
                                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddLink}
                                                    disabled={!newLinkUrl || !newLinkTitle}
                                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={16} />
                                                    Add Link
                                                </button>
                                            </div>

                                            {/* Existing Links List */}
                                            {externalLinks.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Current Links</h4>
                                                    {externalLinks.map((link) => {
                                                        const Icon = getLinkIcon(link.type);
                                                        return (
                                                            <div
                                                                key={link.id}
                                                                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                                            >
                                                                <Icon size={16} className="text-gray-600 dark:text-gray-400 mt-0.5 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                        {link.title}
                                                                    </p>
                                                                    {link.description && (
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                                            {link.description}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                                                        {link.url}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveLink(link.id)}
                                                                    className="shrink-0 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                                    title="Remove link"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
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
