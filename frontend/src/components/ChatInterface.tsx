import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, RotateCcw, ChefHat } from 'lucide-react';
import { Message } from '../types';
import { askQuestion } from '../services/api';
import ChatMessage from './ChatMessage';

const EXAMPLE_QUESTIONS = [
  "How do I make pasta carbonara?",
  "What's a good recipe for chocolate cake?",
  "How to make homemade pizza dough?",
];

interface ChatInterfaceProps {
  onAdminClick: () => void;
}

export default function ChatInterface({ onAdminClick }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await askQuestion(userMessage.content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.answer,
        sources: response.source_documents,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(
        err.status === 429
          ? 'Rate limit exceeded. Please wait a moment and try again.'
          : err.message || 'Failed to get response. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Recipe AI Assistant</h1>
              <p className="text-sm text-gray-500">Your culinary companion</p>
            </div>
          </div>
          <button
            onClick={onAdminClick}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Admin
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <ChefHat className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Welcome to Recipe AI Assistant
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Ask me anything about recipes, cooking techniques, ingredients, and more!
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              <p className="text-sm text-gray-500 mb-2">Try asking:</p>
              {EXAMPLE_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(question)}
                  className="px-4 py-3 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl text-left text-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                  <p className="text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 bg-gradient-to-t from-amber-50 pt-4">
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any recipe..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
