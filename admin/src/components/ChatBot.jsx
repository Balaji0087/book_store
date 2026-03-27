import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, RefreshCcw, MessageSquare } from 'lucide-react';

const ChatBot = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'intro',
            role: 'assistant',
            text: 'Hello Admin! Send a question like \"Show me sales details from feb 1 to feb 20 2026\".',
            displayText: 'Hello Admin! Send a question like "Show me sales details from feb 1 to feb 20 2026".',
            data: null,
            toolUsed: null,
            isAnimated: false
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingStatus, setTypingStatus] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState(null);
    const [thinking, setThinking] = useState(false);
    const [showTableFor, setShowTableFor] = useState(null);
    const [dotCount, setDotCount] = useState(0);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, typingStatus, loading, thinking]);

    useEffect(() => {
        if (!typingStatus && !thinking) return;

        const timer = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4);
        }, 300);

        return () => clearInterval(timer);
    }, [typingStatus, thinking]);

    const animateAssistant = (messageId, fullText, hasData) => {
        let index = 0;
        const interval = setInterval(() => {
            index += 1;
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId
                        ? { ...msg, displayText: fullText.slice(0, index) }
                        : msg
                )
            );

            if (index >= fullText.length) {
                clearInterval(interval);
                setTypingStatus(false);
                setTypingMessageId(null);

                // Show table after text animation if message has data
                if (hasData) {
                    setTimeout(() => {
                        setShowTableFor(messageId);
                    }, 300); // Small delay for smooth transition
                }
            }
        }, 20);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        setError(null);
        const text = input.trim();
        setInput('');

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text,
            displayText: text,
            data: null,
            toolUsed: null,
            isAnimated: false
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);
        setThinking(true);

        try {
            const res = await axios.post('http://localhost:8001/chat', { message: text }, { timeout: 30000 });
            const assistant = res?.data?.response;
            const answer = assistant?.answer?.toString() || 'No response from server.';
            const toolUsed = assistant?.tool_used || 'none';
            const data = assistant?.data || null;

            const assistantMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: answer,
                displayText: '',
                data,
                toolUsed,
                isAnimated: true
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setThinking(false);
            setTypingMessageId(assistantMessage.id);
            setTypingStatus(true);

            setTimeout(() => {
                animateAssistant(assistantMessage.id, answer, !!data);
            }, 400);
        } catch (err) {
            setError('Chatbot request failed. Please confirm the API is running at http://localhost:8001/chat');
            setMessages((prev) => [
                ...prev,
                {
                    id: `assistant-error-${Date.now()}`,
                    role: 'assistant',
                    text: 'Unable to get a response. Please check your server.',
                    displayText: 'Unable to get a response. Please check your server.',
                    data: null,
                    toolUsed: null,
                    isAnimated: false
                }
            ]);
            setThinking(false);
            setTypingStatus(false);
            setTypingMessageId(null);
            setShowTableFor(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderDataTable = (data) => {
        if (!Array.isArray(data) || data.length === 0) return null;

        // Extract headers dynamically from first object
        const headers = Object.keys(data[0]);

        const formatValue = (value, key) => {
            // Format price with currency symbol
            if (key.toLowerCase() === 'price' && typeof value === 'number') {
                return `₹${value}`;
            }
            // Format rating with star or keep as is
            if (key.toLowerCase() === 'rating') {
                return `${value}★`;
            }
            return value;
        };

        const capitalizeHeader = (str) => {
            return str
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (match) => match.toUpperCase())
                .trim();
        };

        return (
            <div className="overflow-x-auto mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Structured Data</h4>
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-blue-100 text-blue-800">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-3 py-2 font-semibold">
                                    {capitalizeHeader(header)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={`${index}-${JSON.stringify(item)}`} className="border-b border-blue-100 even:bg-blue-50">
                                {headers.map((header) => (
                                    <td key={`${index}-${header}`} className="px-3 py-2 text-gray-800">
                                        {formatValue(item[header], header) || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="p-5 md:p-8 w-full h-full flex flex-col">
            <div className="mb-5 sm:mb-6 flex items-center gap-3 text-blue-900">
                <MessageSquare className="h-6 w-6" />
                <h2 className="text-xl md:text-2xl font-bold">Admin AI Assistant</h2>
            </div>

            <div className="flex-1 min-h-[400px] max-h-[calc(100vh-200px)] overflow-y-auto space-y-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm chat-scrollbar">
                <div className="mb-2 text-xs text-center text-gray-500 uppercase tracking-wider">Conversation</div>
                <div className="flex flex-col gap-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`relative rounded-2xl px-4 py-3 max-w-[80%] md:max-w-[65%] break-words shadow-sm ${msg.role === 'assistant'
                                    ? 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-none'
                                    : 'bg-blue-600 text-white rounded-br-none'
                                }`}>
                                <div className="flex items-center justify-between gap-2 text-[11px] opacity-80 mb-1">
                                    <span>{msg.role === 'assistant' ? 'Assistant' : 'You'}</span>
                                    <span>{new Date(parseInt(msg.id.split('-').pop()) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {msg.role === 'assistant' && msg.isAnimated
                                        ? (msg.displayText || <span className="italic text-gray-500">Preparing answer...</span>)
                                        : msg.displayText}
                                    {msg.id === typingMessageId && typingStatus && (
                                        <span className="ml-1 text-blue-200 animate-pulse">|</span>
                                    )}
                                </div>
                                {msg.role === 'assistant' && msg.data && showTableFor === msg.id && (
                                    <>
                                        {renderDataTable(msg.data)}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {thinking && (
                    <div className="flex justify-start">
                        <div className="relative rounded-2xl px-4 py-3 max-w-[80%] md:max-w-[65%] break-words shadow-sm bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-none">
                            <div className="flex items-center justify-between gap-2 text-[11px] opacity-80 mb-1">
                                <span>Assistant</span>
                                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-sm leading-relaxed flex items-center gap-1">
                                <span>Thinking</span>
                                <span className="flex gap-1">
                                    <span className={`w-1 h-1 bg-gray-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                                    <span className={`w-1 h-1 bg-gray-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                                    <span className={`w-1 h-1 bg-gray-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-h-[92px] rounded-2xl border-2 border-blue-300 px-5 py-4 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ask the admin assistant something like: Show me sales from Feb 1 to Feb 20 2026"
                    disabled={loading}
                />

                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                    {loading ? (
                        <>
                            <span className="animate-pulse">Sending</span>
                            <span className="text-xs">...</span>
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            <span>Send</span>
                        </>
                    )}
                </button>

                <button
                    onClick={() => {
                        setInput('');
                        setMessages([
                            {
                                id: 'intro',
                                role: 'assistant',
                                text: 'Hello Admin! Send a question like "Show me sales details from feb 1 to feb 20 2026".',
                                displayText: 'Hello Admin! Send a question like "Show me sales details from feb 1 to feb 20 2026".',
                                data: null,
                                toolUsed: null,
                                isAnimated: false
                            }
                        ]);
                        setError(null);
                        setThinking(false);
                        setTypingStatus(false);
                        setTypingMessageId(null);
                        setShowTableFor(null);
                    }}
                    className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
