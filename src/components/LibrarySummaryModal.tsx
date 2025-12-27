import { X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LibrarySummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string;
    isGenerating: boolean;
}

export default function LibrarySummaryModal({
    isOpen,
    onClose,
    summary,
    isGenerating,
}: LibrarySummaryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles size={24} className="text-white" />
                                <h2 className="text-2xl font-bold text-white">
                                    Your Reading Journey
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Analyzing your library and generating insights...
                                </p>
                            </div>
                        ) : summary ? (
                            <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {summary}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                                No summary available. Click "AI Summary" to generate one.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
