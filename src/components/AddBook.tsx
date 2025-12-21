'use client';

import { useState } from 'react';
import { Book } from '@/types/book';
import { uploadImage } from '@/lib/api';

interface AddBookProps {
    onAddBook: (book: Book) => void;
    currentBooks: Book[];
}

export default function AddBook({ onAddBook, currentBooks }: AddBookProps) {
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [category, setCategory] = useState('');
    const [dateCompleted, setDateCompleted] = useState('');
    const [isUploading, setIsUploading] = useState(false);

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
        setIsUploading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            // Calculate next completion order
            const maxOrder = currentBooks.length > 0
                ? Math.max(...currentBooks.map(b => b.completionOrder || 0))
                : 0;
            const nextOrder = maxOrder + 1;

            const newBook: Book = {
                id: Date.now().toString(),
                title,
                image: imageUrl,
                rating,
                review,
                category,
                dateCompleted,
                completionOrder: nextOrder,
            };

            onAddBook(newBook);

            // Reset form
            setTitle('');
            setImageFile(null);
            setImagePreview('');
            setRating(0);
            setReview('');
            setCategory('');
            setDateCompleted('');
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Add a New Book</h2>
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
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rating (0-5, 0 = Not Rated)</label>
                <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    <option value={0}>Not Rated</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                            {num} {'★'.repeat(num)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Review</label>
                <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={4}
                    placeholder="What did you think of this book?"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., Fiction, Non-fiction, Science Fiction"
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
            <button
                type="submit"
                disabled={isUploading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isUploading ? 'Adding Book...' : 'Add Book'}
            </button>
        </form>
    );
}