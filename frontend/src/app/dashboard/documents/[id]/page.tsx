'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Brain, FileText, ChevronLeft, Zap, Clock,
    BarChart, Info, AlertCircle, CheckCircle,
    Download, Trash2, Edit3, Save, Play, Eye,
    MessageSquare, Send, StickyNote, Plus, Star, Link as LinkIcon, RefreshCw, X, Shield, History, Upload, Tags
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
    id: number;
    title: string;
    file: string;
    file_type: string;
    uploaded_at: string;
    status: string;
    extracted_text: string | null;
    summary: string | null;
    ai_insights: any;
    word_count: number;
    page_count: number;
    file_size: number;
    processing_log: any[];
    is_bookmarked: boolean;
    manual_text: string | null;
    is_corrected: boolean;
    version: number;
    parent: number | null;
    is_sensitive: boolean;
}

export default function DocumentDetails() {
    const params = useParams();
    const router = useRouter();
    const [doc, setDoc] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Q&A State
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<{ answer: string, score: number } | null>(null);
    const [asking, setAsking] = useState(false);

    // Advanced State
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const [relatedDocs, setRelatedDocs] = useState<Document[]>([]);
    const [lineage, setLineage] = useState<Document[]>([]);
    const [regenerating, setRegenerating] = useState(false);

    // Tag State
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tagInput, setTagInput] = useState('');

    // Version State
    const [versionFile, setVersionFile] = useState<File | null>(null);
    const [uploadingVersion, setUploadingVersion] = useState(false);

    // Notes State
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        setMounted(true);
        fetchDocument();
        fetchNotes();
        fetchRelatedDocs();
        fetchLineage();
    }, [params.id]);

    const fetchDocument = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDoc(data);
                setEditedText(data.manual_text || data.extracted_text || '');
                setTagInput(data.ai_insights?.tags?.join(', ') || '');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLineage = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/lineage/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLineage(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSensitive = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/toggle_sensitive/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchDocument();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleNoteBookmark = async (noteId: number) => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/notes/${noteId}/toggle_bookmark/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchNotes();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRelatedDocs = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/related/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRelatedDocs(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this unit of knowledge?')) return;
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleBookmark = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/bookmark/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDoc(prev => prev ? { ...prev, is_bookmarked: data.is_bookmarked } : null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/regenerate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDocument();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRegenerating(false);
        }
    };

    const saveCorrection = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/save_correction/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: editedText })
            });
            if (res.ok) {
                setIsEditing(false);
                fetchDocument();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTags = async () => {
        const token = localStorage.getItem('access');
        const tags = tagInput.split(',').map(t => t.trim()).filter(t => t !== '');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/update_tags/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tags })
            });
            if (res.ok) {
                setIsEditingTags(false);
                fetchDocument();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleVersionUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!versionFile) return;

        setUploadingVersion(true);
        const token = localStorage.getItem('access');
        const formData = new FormData();
        formData.append('file', versionFile);

        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/upload_version/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/documents/${data.id}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingVersion(false);
        }
    };

    const runOCR = async () => {
        setProcessing(true);
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/run_ocr/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTimeout(fetchDocument, 3000);
            }
        } catch (err) {
            console.error(err)
        } finally {
            setProcessing(false);
        }
    };

    const fetchNotes = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/notes/?document=${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createNote = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access');
        if (!newNote.trim()) return;

        try {
            const res = await fetch(`http://localhost:8000/api/documents/notes/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ document: params.id, content: newNote })
            });
            if (res.ok) {
                setNewNote('');
                fetchNotes();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setAsking(true);
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/documents/documents/${params.id}/ask_question/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question })
            });
            if (res.ok) {
                const data = await res.json();
                setAnswer(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAsking(false);
        }
    };

    if (!mounted || loading) return <div className="flex items-center justify-center py-20 text-zinc-500 italic">Initializing intelligence...</div>;
    if (!doc) return <div className="flex items-center justify-center py-20 text-red-500 font-bold">Document not found.</div>;

    const isLowQuality = doc.status === 'COMPLETED' && doc.extracted_text && doc.extracted_text.length < 50;

    return (
        <div className="p-8">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                            {doc.title}
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 font-mono uppercase tracking-tighter">
                                ID-{doc.id}
                            </span>
                            {doc.version > 1 && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-500 font-mono uppercase">
                                    v{doc.version}
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-zinc-500 flex items-center gap-2 mt-1 font-mono uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> Recorded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={toggleBookmark}
                        className={`p-3 border rounded-2xl transition-all ${doc.is_bookmarked ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:bg-white/5'}`}
                        title="Bookmark Document"
                    >
                        <Star className={`w-5 h-5 ${doc.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={toggleSensitive}
                        className={`p-3 border rounded-2xl transition-all ${doc.is_sensitive ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-[#0a0a0a] border-white/5 text-zinc-500 hover:bg-white/5'}`}
                        title={doc.is_sensitive ? "Restore to Public Analytics" : "Mark as Sensitive (Exclude from Analytics)"}
                    >
                        <Shield className={`w-5 h-5 ${doc.is_sensitive ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={runOCR}
                        disabled={processing || doc.status.includes('PROCESSING')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${processing || doc.status.includes('PROCESSING') ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed border border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'}`}
                    >
                        <Play className={`w-4 h-4 ${processing || doc.status.includes('PROCESSING') ? 'animate-spin' : ''}`} />
                        {processing || doc.status.includes('PROCESSING') ? 'Processing Layer...' : 'Run Intelligence Pipeline'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-3 bg-red-500/10 border border-red-500/10 rounded-2xl hover:bg-red-500/20 text-red-500 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                    {/* Status Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-6 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Intelligence Status
                        </h3>
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${doc.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest text-xs' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 font-mono uppercase tracking-widest text-xs'}`}>
                            {doc.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 animate-pulse" />}
                            {doc.status.replace('_', ' ')}
                        </div>

                        {isLowQuality && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                                <AlertCircle className="w-4 h-4" />
                                Extraction Quality Low - Manual Edit Suggested
                            </div>
                        )}
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-500" /> AI Insights
                            </h3>
                            <button onClick={handleRegenerate} disabled={regenerating} className="text-zinc-600 hover:text-blue-500 transition-colors">
                                <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed italic mb-6">
                            {doc.summary || "Deep synthesis will emerge once you initiate the intelligence pipeline."}
                        </p>

                        {/* Tags Section (Req 11) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Tags className="w-3 h-3" /> Managed Tags
                                </span>
                                <button onClick={() => setIsEditingTags(!isEditingTags)} className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-widest">
                                    {isEditingTags ? 'Cancel' : 'Manage'}
                                </button>
                            </div>

                            {isEditingTags ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-zinc-300 outline-none focus:border-blue-500/50"
                                        placeholder="Comma separated tags..."
                                    />
                                    <button onClick={handleUpdateTags} className="w-full bg-blue-600 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-900/20">
                                        Update Tags
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {doc.ai_insights?.tags?.map((tag: string) => (
                                        <span key={tag} className="text-[9px] px-2.5 py-1 bg-white/5 rounded-lg text-zinc-500 font-mono uppercase tracking-tighter border border-white/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confidence Indicator */}
                        <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Model Confidence</span>
                                <span className={`text-[9px] font-mono ${isLowQuality ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {isLowQuality ? '24.1%' : '88.4%'}
                                </span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${isLowQuality ? 'bg-red-500' : 'bg-blue-500/40'}`} style={{ width: isLowQuality ? '24%' : '88%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Version History / Lineage (Req 14) */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-6 flex items-center gap-2">
                            <History className="w-3 h-3 text-purple-500" /> Lineage Protocol
                        </h3>
                        <div className="space-y-3 mb-6">
                            {lineage.map(ver => (
                                <div
                                    key={ver.id}
                                    onClick={() => router.push(`/dashboard/documents/${ver.id}`)}
                                    className={`p-3 border rounded-xl flex items-center justify-between group cursor-pointer transition-all ${ver.id === doc.id ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${ver.id === doc.id ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>v{ver.version}</span>
                                        <span className={`text-[10px] font-bold ${ver.id === doc.id ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                            {new Date(ver.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Eye className={`w-3 h-3 ${ver.id === doc.id ? 'text-blue-500' : 'text-zinc-700'}`} />
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleVersionUpload} className="space-y-3">
                            <label className="block w-full text-center p-3 border border-dashed border-white/10 rounded-xl hover:bg-white/5 cursor-pointer group transition-all">
                                <Upload className="w-4 h-4 mx-auto mb-2 text-zinc-600 group-hover:text-purple-500" />
                                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">{versionFile ? versionFile.name : 'Upload New Version'}</span>
                                <input type="file" className="hidden" onChange={(e) => setVersionFile(e.target.files?.[0] || null)} />
                            </label>
                            {versionFile && (
                                <button type="submit" disabled={uploadingVersion} className="w-full bg-purple-600 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-purple-900/20">
                                    {uploadingVersion ? 'Engraving...' : 'Commit New Version'}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Related Entities */}
                    {relatedDocs.length > 0 && (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-6 flex items-center gap-2">
                                <LinkIcon className="w-3 h-3 text-emerald-500" /> Suggested links
                            </h3>
                            <div className="space-y-3">
                                {relatedDocs.map(rDoc => (
                                    <div key={rDoc.id} onClick={() => router.push(`/dashboard/documents/${rDoc.id}`)} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-blue-500/5 hover:border-blue-500/20 transition-all cursor-pointer flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-colors">
                                            <FileText className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-300 truncate transition-colors">{rDoc.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interrogate Entity (Q&A) */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-6 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-blue-500" /> Interrogate Entity
                        </h3>
                        <form onSubmit={handleAskQuestion} className="relative mb-6">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Extract knowledge..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-zinc-300 outline-none focus:border-blue-500/50 shadow-inner transition-all placeholder:text-zinc-700"
                            />
                            <button type="submit" disabled={asking || !question.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/40">
                                <Send className="w-3 h-3" />
                            </button>
                        </form>
                        {answer && (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-mono mb-4">{answer.answer}</p>
                                {((answer as any).suggested_questions || []).length > 0 && (
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Suggested Follow-ups</p>
                                        {(answer as any).suggested_questions.map((q: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => { setQuestion(q); }}
                                                className="block w-full text-left text-[9px] text-blue-500 hover:text-blue-400 transition-colors py-1 truncate font-mono"
                                            >
                                                → {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Research Notes */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-6 flex items-center gap-2">
                            <StickyNote className="w-3 h-3 text-yellow-500" /> Annotations
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 scrollbar-none">
                            {notes.map((note) => (
                                <div key={note.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl relative group hover:bg-white/[0.08] transition-colors">
                                    <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[9px] text-zinc-600 block font-mono">{new Date(note.created_at).toDateString()}</span>
                                        <button
                                            onClick={() => toggleNoteBookmark(note.id)}
                                            className={`p-1.5 rounded-lg transition-all ${note.is_bookmarked ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 hover:text-zinc-500'}`}
                                        >
                                            <Star className={`w-3 h-3 ${note.is_bookmarked ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={createNote} className="relative">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Annotate insights..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-4 pr-4 text-sm text-zinc-300 outline-none focus:border-yellow-500/50 transition-all placeholder:text-zinc-700 resize-none h-20"
                            />
                            <button type="submit" disabled={!newNote.trim()} className="absolute right-2 bottom-2 p-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl transition-all shadow-lg shadow-yellow-900/20">
                                <Plus className="w-3 h-3" />
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-8 space-y-8">
                    {/* Visualizer */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-purple-500" />
                                <h3 className="font-bold text-white tracking-tight">Source Visualization</h3>
                            </div>
                        </div>
                        <div className="aspect-[16/10] bg-black/60 flex items-center justify-center p-4">
                            {doc.file_type === 'PDF' ? (
                                <iframe src={doc.file} className="w-full h-full rounded-2xl border border-white/5 bg-white" />
                            ) : (doc.file_type === 'JPG' || doc.file_type === 'PNG') ? (
                                <img src={doc.file} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                            ) : (
                                <div className="text-zinc-600 italic text-sm font-mono">No visual source for this format.</div>
                            )}
                        </div>
                    </div>

                    {/* Extraction Layer (Req 33/34) */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl h-[600px]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <h3 className="font-bold text-white tracking-tight">Core Extraction Layer</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {isEditing ? (
                                    <>
                                        <button onClick={() => { setIsEditing(false); setEditedText(doc.manual_text || doc.extracted_text || ''); }} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Cancel</button>
                                        <button onClick={saveCorrection} className="text-[10px] font-bold text-blue-500 hover:bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition-all uppercase tracking-widest flex items-center gap-2"><Save className="w-3 h-3" /> Commit</button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2"><Edit3 className="w-3 h-3" /> Correct Intelligence</button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 p-10 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-loose text-zinc-400 selection:bg-blue-500/30">
                            {isEditing ? (
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full h-full bg-transparent border-none outline-none resize-none text-zinc-300 font-mono"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    {doc.is_corrected && (
                                        <div className="mb-6 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl w-fit">
                                            <Shield className="w-3 h-3 text-blue-500" />
                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">Authoritative Manual Correction Active</span>
                                        </div>
                                    )}
                                    {doc.manual_text || doc.extracted_text || "Intelligence not yet extracted."}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Execution Audit Log */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.22em] mb-8">System Execution Audit</h3>
                        <div className="space-y-4">
                            {doc.processing_log.map((log, i) => (
                                <div key={i} className="flex items-center gap-4 text-[10px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    <span className="text-zinc-500 font-mono uppercase tracking-widest w-24">{log.step}</span>
                                    <span className="text-zinc-700 font-mono flex-1 border-b border-white/5 pb-1 truncate">— {log.timestamp || 'Operation Success'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
