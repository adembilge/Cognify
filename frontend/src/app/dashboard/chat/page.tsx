'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Bot, Loader2, FileText, Sparkles } from 'lucide-react';

interface Source {
    id: number;
    title: string;
}

interface Message {
    role: 'user' | 'bot';
    content: string;
    sources?: Source[];
    suggested_questions?: string[];
}

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Hello! I am Cognify AI. Ask me anything about your documents.' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        const token = localStorage.getItem('access');
        try {
            const res = await fetch('http://localhost:8000/api/documents/global_chat/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: userMsg })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: data.answer,
                    sources: data.sources,
                    suggested_questions: data.suggested_questions
                }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error accessing your vault.' }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', content: 'Connection failure. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col p-8">
            <header className="mb-8 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-500" />
                <div>
                    <h1 className="text-3xl font-bold text-white">Neural Chat</h1>
                    <p className="text-zinc-500">Synthesize knowledge from your entire vault</p>
                </div>
            </header>

            <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'bot' && (
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-blue-400" />
                                </div>
                            )}

                            <div className={`max-w-2xl space-y-2`}>
                                <div className={`p-5 rounded-3xl ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none'
                                    }`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pl-2">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold py-1">Sources:</span>
                                        {msg.sources.map(s => (
                                            <a key={s.id} href={`/dashboard/documents/${s.id}`} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-colors text-xs text-blue-400 border border-blue-500/20">
                                                <FileText className="w-3 h-3" />
                                                {s.title}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {msg.role === 'bot' && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                        {msg.suggested_questions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setInput(q); }}
                                                className="text-[9px] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 hover:bg-blue-500/20 transition-all font-mono uppercase tracking-widest"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-zinc-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 animate-pulse">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="bg-white/5 border border-white/5 p-5 rounded-3xl rounded-tl-none flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                                <span className="text-sm text-zinc-500 italic">Reading documents...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question across your entire specific knowledge base..."
                            className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-zinc-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-lg placeholder:text-zinc-600"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
                        Cognify Knowledge Engine v0.1 • Context limit: 3 sources
                    </p>
                </div>
            </div>
        </div>
    );
}
