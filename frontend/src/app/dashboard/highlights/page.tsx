'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, FileText, Brain, ArrowUpRight, Zap, Sparkles, Clock } from 'lucide-react';

interface Document {
    id: number;
    title: string;
    summary: string | null;
    is_bookmarked: boolean;
    uploaded_at: string;
    ai_insights: any;
}

export default function HighlightsPage() {
    const [highlights, setHighlights] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchHighlights();
    }, []);

    const fetchHighlights = async () => {
        const token = localStorage.getItem('access');
        try {
            // Fetch all docs and client-side filter for bookmarks or high importance
            const res = await fetch('http://localhost:8000/api/documents/documents/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Requirement: Bookmark important documents, summaries, or insights
                const filtered = data.filter((d: Document) => d.is_bookmarked);
                setHighlights(filtered);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-zinc-500 italic">Curating your knowledge highlights...</div>;

    return (
        <div className="p-8">
            <header className="max-w-7xl mx-auto mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Knowledge Protocol</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Vault Highlights</h1>
                <p className="text-zinc-500 text-lg max-w-2xl leading-relaxed">
                    A curated synthesis of your most significant insights, bookmarked entities, and high-confidence patterns.
                </p>
            </header>

            <div className="max-w-7xl mx-auto">
                {highlights.length === 0 ? (
                    <div className="py-20 flex flex-col items-center text-center bg-white/[0.02] border border-white/5 rounded-[3rem]">
                        <Star className="w-12 h-12 text-zinc-700 mb-6" />
                        <h3 className="text-xl font-bold text-white mb-2">No bookmarks yet</h3>
                        <p className="text-zinc-600 max-w-sm">Mark documents as "Important" in the detail view to see them surface here as core knowledge units.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {highlights.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                                className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:border-yellow-500/20 transition-all cursor-pointer group flex flex-col shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-zinc-700 group-hover:text-yellow-500 transition-colors" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-yellow-500 transition-colors">{doc.title}</h3>
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                                        <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-4">
                                            "{doc.summary || "No summary generated for this high-value unit."}"
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-zinc-600" />
                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {doc.ai_insights?.tags?.slice(0, 2).map((tag: string) => (
                                            <span key={tag} className="text-[8px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-zinc-600 font-bold uppercase">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
