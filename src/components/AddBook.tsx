'use client';

import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { uploadImage } from '@/lib/api';
import CategorySelect from './CategorySelect';
import StarRating from './StarRating';

interface AddBookProps {
    onAddBook: (book: Book) => void;
    onCancel: () => void;
    currentBooks: Book[];
}

export default function AddBook({ onAddBook, onCancel, currentBooks }: AddBookProps) {
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [category, setCategory] = useState('');
    const [dateCompleted, setDateCompleted] = useState('');
    const [completionOrder, setCompletionOrder] = useState(1);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const maxOrder = currentBooks.length > 0
            ? Math.max(...currentBooks.map(b => b.completionOrder || 0))
            : 0;
        setCompletionOrder(maxOrder + 1);
    }, [currentBooks]);

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

            const newBook: Book = {
                id: Date.now().toString(),
                title,
                image: imageUrl,
                rating,
                review,
                category,
                dateCompleted,
                completionOrder,
            };

            onAddBook(newBook);

            // Reset form
            setTitle('');
            setImageFile(null);
            setImagePreview('');
            setRating(0);
            setReview('');
            setCategory('');
            setReview('');
            setCategory('');
            setDateCompleted('');
            // Recalculate next order logic is handled by useEffect when currentBooks updates,
            // but for immediate UI feedback we might want to increment locally too if we don't wait for props update
            // However, since onAddBook likely triggers a refresh which updates props, we can rely on useEffect.
            // But to be safe let's just increment local state for now.
            setCompletionOrder(prev => prev + 1);
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
                    placeholder="What did you think of this book?"
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
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Completion Order</label>
                <input
                    type="number"
                    min="1"
                    value={completionOrder}
                    onChange={(e) => setCompletionOrder(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                />
            </div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
                    disabled={isUploading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                    {isUploading ? 'Adding...' : 'Add Book'}
                </button>
            </div>
        </form>
    );
}