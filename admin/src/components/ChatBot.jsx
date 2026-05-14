import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, RefreshCcw, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { CHATBOT_URL } from '../utils/api';

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
    const [typingStatus, setTypingStatus] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState(null);
    const [thinking, setThinking] = useState(false);
    const [showTableFor, setShowTableFor] = useState(null);
    const [dotCount, setDotCount] = useState(0);
    const inputRef = useRef(null);
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
            const res = await axios.post(`${CHATBOT_URL}/chat`, {
                message: text,
                role: 'admin'
            }, { timeout: 30000 });
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
            const message = `Chatbot request failed. Please confirm the API is running at ${CHATBOT_URL}/chat`;
            toast.error(message, { autoClose: 5000 });
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
            // Keep focus on input after sending message
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
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
        <div className="relative w-full min-h-screen p-5 md:p-8 flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
            <div className="mb-6 sm:mb-8 flex items-center gap-4 text-blue-900">
                <div className="p-3 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 rounded-xl shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 bg-clip-text text-transparent">
                        Admin AI Assistant
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Your intelligent bookstore management companion</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-xl">
                <div className="border-b border-blue-100 px-6 py-3 text-xs text-center text-gray-500 uppercase tracking-wider font-medium">Conversation</div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-scrollbar">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`relative rounded-2xl px-5 py-4 max-w-[85%] md:max-w-[70%] break-words shadow-lg border ${msg.role === 'assistant'
                                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200 rounded-bl-none'
                                    : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 text-white border-blue-500 rounded-br-none'
                                    }`}>
                                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-2">
                                        <span className="font-medium">{msg.role === 'assistant' ? 'Assistant' : 'You'}</span>
                                        <span>{new Date(parseInt(msg.id.split('-').pop()) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {(() => {
                                            const rawText = msg.role === 'assistant' && msg.isAnimated
                                                ? (msg.displayText || "Preparing answer...")
                                                : msg.displayText;

                                            if (rawText === "Preparing answer...") {
                                                return <span className="italic text-gray-500">Preparing answer...</span>;
                                            }

                                            let html = rawText
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                .replace(/\n- (.*?)(?=\n|$)/g, '<br/>• $1');

                                            return <span dangerouslySetInnerHTML={{ __html: html }} />;
                                        })()}
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
                        {thinking && (
                            <div className="flex justify-start">
                                <div className="relative rounded-2xl px-5 py-4 max-w-[85%] md:max-w-[70%] break-words shadow-lg border bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border-gray-200 rounded-bl-none">
                                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-2">
                                        <span className="font-medium">Assistant</span>
                                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="text-sm leading-relaxed flex items-center gap-1">
                                        <span>Thinking</span>
                                        <span className="flex gap-1">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-blue-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={bottomRef} />
                </div>

                <div className="sticky bottom-0 border-t border-blue-100 bg-white/95 p-4 backdrop-blur-sm z-10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 min-h-[88px] rounded-2xl border-2 border-blue-200 px-4 py-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm placeholder-gray-500"
                            placeholder="Ask the admin assistant something like: Show me sales from Feb 1 to Feb 20 2026"
                            disabled={loading}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 px-5 py-3 text-sm font-semibold text-white transition-all hover:from-blue-800 hover:via-blue-700 hover:to-blue-500 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                                    setThinking(false);
                                    setTypingStatus(false);
                                    setTypingMessageId(null);
                                    setShowTableFor(null);
                                }}
                                className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl border-2 border-gray-300 bg-white/90 backdrop-blur-sm px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-lg hover:shadow-xl transition-all"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
