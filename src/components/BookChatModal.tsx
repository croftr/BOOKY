import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Book } from '@/types/book';

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface BookChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    books: Book[];
}

export default function BookChatModal({
    isOpen,
    onClose,
    books,
}: BookChatModalProps) {
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationHistory]);

    // Initialize chat when modal opens
    useEffect(() => {
        if (isOpen && !hasInitialized && books.length > 0) {
            initializeChat();
        }
    }, [isOpen, hasInitialized, books]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setConversationHistory([]);
            setUserInput('');
            setHasInitialized(false);
        }
    }, [isOpen]);

    const initializeChat = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/library/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    books,
                    conversationHistory: [],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize chat');
            }

            const data = await response.json();
            setConversationHistory([
                {
                    role: 'assistant',
                    content: data.message,
                },
            ]);
            setHasInitialized(true);
        } catch (error) {
            console.error('Error initializing chat:', error);
            setConversationHistory([
                {
                    role: 'assistant',
                    content: 'Sorry, I had trouble starting the chat. Please try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');

        // Add user message to conversation
        const newUserMessage: ConversationMessage = {
            role: 'user',
            content: userMessage,
        };
        setConversationHistory((prev) => [...prev, newUserMessage]);

        setIsLoading(true);
        try {
            const response = await fetch('/api/library/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    books,
                    conversationHistory: [...conversationHistory, newUserMessage],
                    userMessage,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            const assistantMessage: ConversationMessage = {
                role: 'assistant',
                content: data.message,
            };
            setConversationHistory((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ConversationMessage = {
                role: 'assistant',
                content: 'Sorry, I had trouble processing your message. Please try again.',
            };
            setConversationHistory((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
                                <MessageCircle size={24} className="text-white" />
                                <h2 className="text-2xl font-bold text-white">
                                    Chat About Your Books
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

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {conversationHistory.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-4 ${
                                        message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="prose dark:prose-invert max-w-none prose-sm">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me about your books..."
                                disabled={isLoading || !hasInitialized}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!userInput.trim() || isLoading || !hasInitialized}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send size={20} />
                                <span className="hidden sm:inline">Send</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
