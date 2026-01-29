'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Upload, Plus, Download, Trash2, Eye,
    Search, FileCheck, AlertCircle, Brain, Sparkles, Clock, X, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
    id: number;
    title: string;
    file: string;
    file_type: string;
    uploaded_at: string;
    status: string;
    file_size: number;
    is_sensitive: boolean;
}

export default function Dashboard() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSemantic, setIsSemantic] = useState(false);

    // Collections
    const [viewMode, setViewMode] = useState<'documents' | 'collections'>('documents');
    const [collections, setCollections] = useState<any[]>([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCollectionModalOpen, setCollectionModalOpen] = useState(false);

    // Filters (Req 17)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Bulk Actions (Req 25)
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const API_URL = 'http://localhost:8000/api/documents/documents/';
    const COLLECTIONS_URL = 'http://localhost:8000/api/documents/collections/';

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('access');
        if (!token) {
            router.push('/auth/login');
        } else {
            fetchCollections();
        }
    }, []);

    const fetchCollections = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(COLLECTIONS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCollections(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(COLLECTIONS_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCollectionName })
            });
            if (res.ok) {
                setNewCollectionName('');
                setCollectionModalOpen(false);
                fetchCollections();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDocuments = async (query = '', tag = '') => {
        const token = localStorage.getItem('access');

        let url = API_URL;
        const params = new URLSearchParams();

        if (tag) {
            params.append('tag', tag);
            url += `search/?${params.toString()}`;
        } else {
            if (query) {
                const endpoint = isSemantic ? 'search/' : '';
                url = `${API_URL}${endpoint}`;
                params.append('q', query);
                if (isSemantic) params.append('semantic', 'true');
            }
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (showTrash) params.append('trash', 'true');

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;
        }

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                router.push('/auth/login');
                return;
            }
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const tag = searchParams.get('tag');

        const delaySearch = setTimeout(() => {
            if (mounted) fetchDocuments(searchQuery, tag || '');
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchQuery, isSemantic, mounted, startDate, endDate, showTrash]);

    const [files, setFiles] = useState<File[]>([]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        setIsUploading(true);
        const token = localStorage.getItem('access');

        try {
            for (const fileItem of files) {
                const formData = new FormData();
                formData.append('title', title || fileItem.name);
                formData.append('file', fileItem);

                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (!res.ok) console.error('Failed to upload', fileItem.name);
            }

            setFiles([]);
            setTitle('');
            setUploadModalOpen(false);
            fetchDocuments();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const clearVault = async () => {
        if (!confirm('EXTREME WARNING: This will permanently purge your entire digital brain. This action cannot be undone. Proceed?')) return;
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API_URL}clear_vault/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDocuments();
                alert('Vault successfully purged.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkExport = async () => {
        if (selectedIds.length === 0) return;
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API_URL}export_bulk/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ doc_ids: selectedIds })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cognify_bulk_export.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setSelectedIds([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === documents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(documents.map(d => d.id));
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Knowledge Vault</h1>
                    <p className="text-zinc-500">Managing {documents.length} intelligent entities</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/5 rounded-2xl px-3 py-1.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-[10px] text-zinc-400 outline-none"
                        />
                        <span className="text-zinc-700 text-[10px]">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-[10px] text-zinc-400 outline-none"
                        />
                        {(startDate || endDate) && (
                            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 hover:text-white text-zinc-600 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSemantic ? 'text-blue-500' : 'text-zinc-500'}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isSemantic ? "Neural search..." : "Quick search..."}
                            className={`bg-[#0a0a0a] border rounded-2xl py-2 pl-10 pr-4 w-full md:w-48 focus:md:w-64 transition-all outline-none ${isSemantic ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/5 focus:border-blue-500/50'}`}
                        />
                        <button
                            onClick={() => { setIsSemantic(!isSemantic); }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isSemantic ? 'bg-blue-500/20 text-blue-500 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                            title="Toggle Semantic Search (Neural Mode)"
                        >
                            <Brain className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearVault}
                            className="p-2.5 bg-red-500/10 border border-red-500/10 rounded-2xl text-red-500 hover:bg-red-500/20 transition-all"
                            title="Purge Vault"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 active:scale-95 transition-all text-xs"
                        >
                            <Plus className="w-4 h-4" /> Ingest
                        </button>
                    </div>
                </div>
            </header>

            {/* Onboarding / System Health Overlay (if no docs) */}
            {documents.length === 0 && !loading && (
                <div className="max-w-4xl mx-auto py-12 px-6 bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-white/5 rounded-[3rem] mb-12 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-8">
                        <Sparkles className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Your Digital Brain is Empty</h2>
                    <p className="text-zinc-500 max-w-lg mb-8 text-lg leading-relaxed">
                        Cognify is ready to engrave your knowledge. Upload PDFs, images, or notes to begin the deep intelligence synthesis.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl text-left">
                        <OnboardingStep number="01" label="Ingest" desc="Upload any document format." />
                        <OnboardingStep number="02" label="Synthesize" desc="AI extracts text and insights." />
                        <OnboardingStep number="03" label="Interrogate" desc="Chat with your vault in real-time." />
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Documents" value={documents.length.toString()} trend="+2 this week" />
                <StatCard label="AI Summaries" value={documents.filter(d => d.status === 'COMPLETED').length.toString()} trend="Live" />
                <StatCard label="Insights" value="Active" color="text-purple-500" />
                <StatCard label="System Health" value="Stable" color="text-emerald-500" />
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => { setViewMode('documents'); setShowTrash(false); }}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === 'documents' && !showTrash ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                    Live Vault
                </button>
                <button
                    onClick={() => { setViewMode('documents'); setShowTrash(true); }}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${showTrash ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-zinc-500 hover:text-white'}`}
                >
                    Recovery Window
                </button>
                <button
                    onClick={() => { setViewMode('collections'); setShowTrash(false); }}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === 'collections' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                    Collections
                </button>
            </div>

            {viewMode === 'collections' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => setCollectionModalOpen(true)}
                        className="bg-[#0a0a0a] border border-white/5 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="font-bold text-zinc-500">New Collection</p>
                    </div>
                    {collections.map(col => (
                        <div key={col.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                            <h3 className="text-xl font-bold text-white mb-2">{col.name}</h3>
                            <p className="text-zinc-500 text-sm mb-6">{col.description || 'No description'}</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                    {col.document_count || 0} items
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Documents Table */
                <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white">Recent Knowledge</h3>
                        <button className="text-sm text-blue-500 hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={documents.length > 0 && selectedIds.length === documents.length}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/50"
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500">Document Name</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500">Status</th>
                                    <th className="px-6 py-4 font-semibold text-zinc-500">Upload Date</th>
                                    <th className="px-6 py-4 font-semibold text-right text-zinc-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence>
                                    {selectedIds.length > 0 && (
                                        <motion.tr
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="bg-blue-600/10 border-b border-blue-500/20"
                                        >
                                            <td colSpan={5} className="px-6 py-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{selectedIds.length} entities selected for processing</span>
                                                    <button
                                                        onClick={handleBulkExport}
                                                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                                    >
                                                        <Download className="w-3 h-3" /> Export Selection
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-500 italic">Decrypting your vault...</td></tr>
                                ) : documents.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-500">No knowledge found. Start your journey by uploading a file.</td></tr>
                                ) : documents.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${selectedIds.includes(doc.id) ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelection(doc.id); }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(doc.id)}
                                                onChange={() => { }} // Controlled by row/cell click
                                                className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-500 focus:ring-blue-500/50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-white" onClick={() => router.push(`/dashboard/documents/${doc.id}`)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors relative">
                                                    <FileText className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                                    {doc.is_sensitive && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                                                            <Shield className="w-2 h-2 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold leading-none mb-1">{doc.title}</p>
                                                        {doc.is_sensitive && <Shield className="w-3 h-3 text-red-500" />}
                                                    </div>
                                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{doc.file_type || 'PDF'} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${doc.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                doc.status.includes('PROCESSING') ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' :
                                                    'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {doc.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">
                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                {showTrash ? (
                                                    <button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('access');
                                                            await fetch(`${API_URL}${doc.id}/restore/`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                                                            fetchDocuments();
                                                        }}
                                                        className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all font-mono"
                                                    >
                                                        Restore Knowledge
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => router.push(`/dashboard/documents/${doc.id}`)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                                        <button
                                                            onClick={async () => {
                                                                const token = localStorage.getItem('access');
                                                                await fetch(`${API_URL}${doc.id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                                fetchDocuments();
                                                            }}
                                                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setUploadModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">Engrave New Knowledge</h2>
                            <p className="text-zinc-500 mb-8">Upload a document to feed your local intelligence.</p>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Knowledge Label</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="E.g. Neural Architecture Research 2026"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Source Entity (File)</label>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500/50'); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500/50'); }}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500/50'); setFiles(Array.from(e.dataTransfer.files)); }}
                                        className="relative border-2 border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center hover:bg-white/5 cursor-pointer transition-all hover:border-blue-500/50 group/upload"
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            required={files.length === 0}
                                        />
                                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover/upload:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <p className="text-white font-bold">{files.length > 0 ? `${files.length} sources selected` : 'Pick knowledge sources'}</p>
                                        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">Supports PDFs, Images, Notes • Batch Ingestion Active</p>
                                    </div>
                                </div>

                                {isUploading && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            <span>Batch Synthesis in Progress...</span>
                                            <span>Active</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 10, repeat: Infinity }}
                                                className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setUploadModalOpen(false)}
                                        className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all text-sm uppercase tracking-widest"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading || files.length === 0}
                                        className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                                    >
                                        {isUploading ? 'Engraving...' : 'Initiate Batch Ingestion'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Collection Modal */}
            <AnimatePresence>
                {isCollectionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCollectionModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6">Create Collection</h2>
                            <form onSubmit={createCollection} className="space-y-6">
                                <input
                                    type="text"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="Collection Name"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                                    autoFocus
                                    required
                                />
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setCollectionModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all text-xs uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newCollectionName}
                                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OnboardingStep({ number, label, desc }: { number: string, label: string, desc: string }) {
    return (
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl group hover:border-blue-500/20 transition-all cursor-default">
            <span className="text-[10px] font-mono text-blue-500 mb-2 block tracking-widest">{number}</span>
            <h4 className="font-bold text-white mb-1">{label}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
        </div>
    );
}

function StatCard({ label, value, trend, color = "text-white" }: { label: string, value: string, trend?: string, color?: string }) {
    return (
        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-white/5 shadow-lg">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">{label}</p>
            <div className="flex items-baseline gap-3">
                <h4 className={`text-3xl font-black ${color} tracking-tight`}>{value}</h4>
                {trend && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">{trend}</span>}
            </div>
        </div>
    );
}
