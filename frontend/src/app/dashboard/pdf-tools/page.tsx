'use client';

import { useState, useEffect } from 'react';
import {
    Scissors, Layers, Trash2, FilePlus,
    Download, AlertCircle, CheckCircle, ChevronRight,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Document {
    id: number;
    title: string;
    file_type: string;
}

export default function PDFToolsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [mode, setMode] = useState<'split' | 'remove' | 'merge' | 'reorganize'>('split');
    const [pages, setPages] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch('http://localhost:8000/api/documents/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.filter((d: any) => d.file_type === 'PDF'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedId) return;
        setStatus('Processing Execution...');
        const token = localStorage.getItem('access');
        const endpoint = mode === 'split' ? 'split_pages' : 'remove_pages';
        const body = mode === 'split'
            ? { ranges: pages.split(',').map(r => r.split('-').map(Number)) }
            : { pages: pages.split(',').map(Number) };

        try {
            const res = await fetch(`http://localhost:8000/api/documents/${selectedId}/${endpoint}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setStatus('Operation Successful. Knowledge branch created.');
            }
        } catch (err) {
            setStatus('Operation failed in the engine.');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20 text-zinc-500 italic">Syncing toolkit...</div>;

    return (
        <div className="p-8">
            <header className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl font-bold">PDF Intelligence Tools</h1>
                <p className="text-zinc-500">Structural manipulation of your knowledge assets.</p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Tool Selection */}
                <div className="lg:col-span-4 space-y-4">
                    <ToolButton
                        active={mode === 'split'}
                        onClick={() => setMode('split')}
                        icon={<Scissors className="w-5 h-5" />}
                        label="Split Entity"
                        desc="Extract specific pages or clusters"
                    />
                    <ToolButton
                        active={mode === 'remove'}
                        onClick={() => setMode('remove')}
                        icon={<Trash2 className="w-5 h-5" />}
                        label="Redact Content"
                        desc="Delete unwanted page layers"
                    />
                    <ToolButton
                        active={mode === 'reorganize'}
                        onClick={() => setMode('reorganize')}
                        icon={<Download className="w-5 h-5 -rotate-90" />}
                        label="Reorganize"
                        desc="Change page sequence via Drag-and-Drop"
                    />
                    <ToolButton
                        active={mode === 'merge'}
                        onClick={() => setMode('merge')}
                        icon={<Layers className="w-5 h-5" />}
                        label="Merge Vaults"
                        desc="Combine multiple sources into one"
                    />
                </div>

                {/* Configuration Panel */}
                <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl">
                    <div className="space-y-10">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-4 text-zinc-500">Target Knowledge Source</label>
                            <select
                                onChange={(e) => setSelectedId(Number(e.target.value))}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500/50 appearance-none text-white text-sm"
                            >
                                <option value="">Select a PDF from your vault...</option>
                                {documents.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                                ))}
                            </select>
                        </div>

                        {mode === 'reorganize' ? (
                            <div className="space-y-6">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">Workspace Visualization</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-black/40 border border-white/5 rounded-3xl border-dashed">
                                    {[1, 2, 3, 4].map((i) => (
                                        <motion.div
                                            key={i}
                                            drag
                                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            className="aspect-[3/4] bg-zinc-900 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors"
                                        >
                                            <FileText className="w-6 h-6 text-zinc-700" />
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Page {i}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 italic text-center">Interactive reordering active. Drag pages to optimize sequence.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-4">
                                    {mode === 'split' ? 'Execution Ranges (e.g. 1-2, 5-10)' : 'Page Redactions (e.g. 1, 3, 5)'}
                                </label>
                                <input
                                    type="text"
                                    value={pages}
                                    onChange={(e) => setPages(e.target.value)}
                                    placeholder={mode === 'split' ? "1-5, 8-10" : "2, 4, 6"}
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500/50 text-white font-mono text-sm"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleAction}
                            disabled={!selectedId}
                            className={`w-full py-5 rounded-2xl font-bold tracking-[0.1em] uppercase text-xs transition-all shadow-xl ${selectedId
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                                }`}
                        >
                            Execute {mode.toUpperCase()} Sequence
                        </button>

                        {status && (
                            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center font-bold text-xs uppercase tracking-widest text-blue-400">
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolButton({ active, icon, label, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-8 rounded-[2.5rem] border transition-all text-left shadow-lg ${active ? 'bg-blue-600/10 border-blue-500/30 text-white scale-[1.02]' : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:border-white/10'
                }`}
        >
            <div className={`p-4 rounded-2xl inline-block mb-6 transition-colors shadow-inner ${active ? 'bg-blue-600 text-white' : 'bg-white/5'}`}>
                {icon}
            </div>
            <h3 className="font-bold mb-2 tracking-tight">{label}</h3>
            <p className="text-[11px] opacity-50 uppercase tracking-tighter leading-relaxed">{desc}</p>
        </button>
    );
}
