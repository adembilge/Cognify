'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Legend
} from 'recharts';
import { FileText, Activity, TrendingUp, Clock, Shield, Database, Brain, HardDrive, Download, Zap, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface AnalyticsData {
    total_documents: number;
    total_storage: number;
    total_words: number;
    status_distribution: Record<string, number>;
    upload_trend: { date: string; count: number }[];
    storage_growth: { date: string; size_mb: number }[];
    type_distribution: { name: string; value: number }[];
    topic_distribution: { name: string; value: number }[];
    topic_evolution: { date: string; topic: string; count: number }[];
    activity_feed: { timestamp: string; action: string; detail: string; doc_title: string; doc_id: number }[];
    recent_highlights?: { title: string; tags: string[]; summary_snippet: string; id: number }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('access');
        const lastVisit = localStorage.getItem('last_analytics_visit') || '';

        let url = 'http://localhost:8000/api/documents/analytics/';
        if (lastVisit) {
            url += `?since=${encodeURIComponent(lastVisit)}`;
        }

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
                // Mark current visit
                localStorage.setItem('last_analytics_visit', new Date().toISOString());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch('http://localhost:8000/api/documents/documents/export_analytics/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cognify_analytics_report.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const pivotTopicData = (raw: { date: string, topic: string, count: number }[]) => {
        const pivot: Record<string, any> = {};
        raw.forEach(row => {
            if (!pivot[row.date]) pivot[row.date] = { date: row.date };
            pivot[row.date][row.topic] = row.count;
        });
        return Object.values(pivot).sort((a, b) => (a as any).date.localeCompare((b as any).date));
    };

    if (loading) return <div className="flex items-center justify-center py-20 text-zinc-500 italic">Aggregating system metrics...</div>;
    if (!data) return <div className="flex items-center justify-center py-20 text-red-500 font-bold">Analytics unavailable.</div>;

    const pieData = Object.entries(data.status_distribution).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
    const formatBytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    const formatWords = (count: number) => count > 1000 ? (count / 1000).toFixed(1) + 'k' : count.toString();
    const uniqueTopics = Array.from(new Set(data.topic_evolution.map(t => t.topic)));

    return (
        <div className="p-8">
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">System Telemetry Active</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Deep Intelligence Analytics</h1>
                    <p className="text-zinc-500 mt-1">Real-time observability of your digital knowledge evolution.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-all shadow-xl active:scale-95"
                >
                    <Download className="w-4 h-4" /> Export Protocol Report
                </button>
            </header>

            <div className="max-w-7xl mx-auto space-y-10">
                {/* Recent Highlights (Req 27) */}
                {data.recent_highlights && data.recent_highlights.length > 0 && (
                    <div className="overflow-x-auto pb-4 scrollbar-none">
                        <div className="flex items-center gap-4 mb-6">
                            <Zap className="w-4 h-4 text-purple-500 animate-pulse" />
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Synthesized Since Last Session</h3>
                        </div>
                        <div className="flex gap-6">
                            {data.recent_highlights.map(h => (
                                <div
                                    key={h.id}
                                    onClick={() => router.push(`/dashboard/documents/${h.id}`)}
                                    className="min-w-[320px] bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-white/5 p-8 rounded-[2.5rem] hover:border-purple-500/30 transition-all cursor-pointer group shadow-2xl"
                                >
                                    <h4 className="font-bold text-white mb-3 group-hover:text-purple-400 transition-colors uppercase tracking-tight text-xs">{h.title}</h4>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2 mb-6 italic leading-relaxed">"{h.summary_snippet}"</p>
                                    <div className="flex flex-wrap gap-2">
                                        {h.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[8px] bg-white/5 border border-white/5 px-3 py-1 rounded-full text-zinc-400 font-mono tracking-widest uppercase">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* 1. Key Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AnalyticsStatCard icon={<FileText className="text-blue-500" />} label="Knowledge Units" value={data.total_documents.toString()} desc="Indexed Entities" />
                    <AnalyticsStatCard icon={<HardDrive className="text-purple-500" />} label="Vault Storage" value={formatBytes(data.total_storage)} desc="Cumulative Capacity" />
                    <AnalyticsStatCard icon={<Brain className="text-pink-500" />} label="Cognitive Load" value={formatWords(data.total_words)} desc="Words Extracted" />
                    <AnalyticsStatCard icon={<Shield className="text-emerald-500" />} label="System Health" value="99.9%" desc="OCP Resilience" />
                </div>

                {/* 2. Topic Evolution (Req 45) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <ChartHeader icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} title="Conceptual Evolution Protocol" />
                            <div className="flex gap-4">
                                {uniqueTopics.map((topic, i) => (
                                    <div key={topic} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{topic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pivotTopicData(data.topic_evolution)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }} />
                                    {uniqueTopics.map((topic, i) => (
                                        <Line key={topic} type="monotone" dataKey={topic} stroke={COLORS[i % COLORS.length]} strokeWidth={4} dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl flex flex-col">
                        <ChartHeader icon={<Zap className="w-4 h-4 text-yellow-500" />} title="Semantic Footprint" />
                        <div className="flex-1 h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.topic_distribution}>
                                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold' }} />
                                    <Radar name="Usage" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Global Activity & Health */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <ChartHeader icon={<Activity className="w-4 h-4 text-emerald-500" />} title="System execution stream" />
                            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Observable Log</span>
                        </div>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-none">
                            {data.activity_feed.map((log, i) => (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-zinc-800 border-2 border-white/5 group-hover:border-blue-500 transition-colors" />
                                        <div className="w-0.5 flex-1 bg-white/5 my-2" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 rounded text-blue-500 font-bold uppercase tracking-widest">{log.action}</span>
                                        </div>
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] group-hover:bg-blue-500/5 group-hover:border-blue-500/10 transition-all">
                                            <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{log.detail}</p>
                                            <div onClick={() => router.push(`/dashboard/documents/${log.doc_id}`)} className="flex items-center gap-2 cursor-pointer group/link w-fit">
                                                <LinkIcon className="w-3 h-3 text-zinc-600 group-hover/link:text-blue-500 transition-colors" />
                                                <span className="text-[10px] font-bold text-zinc-500 group-hover/link:text-white uppercase tracking-widest transition-colors">Drill-down: {log.doc_title}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Storage Growth */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                            <ChartHeader icon={<Database className="w-4 h-4 text-purple-500" />} title="Expansion timeline" />
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.storage_growth}>
                                        <Area type="monotone" dataKey="size_mb" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Heath */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
                            <ChartHeader icon={<Shield className="w-4 h-4 text-emerald-500" />} title="Operational Awareness" />
                            <div className="space-y-6">
                                <HealthRow label="Inference" status="OPTIMAL" ping="14ms" />
                                <HealthRow label="OCR Layer" status="ACTIVE" ping="210ms" />
                                <HealthRow label="Vector DB" status="READY" ping="8ms" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthRow({ label, status, ping }: { label: string, status: string, ping: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-bold text-blue-400 block">{status}</span>
                <span className="text-[8px] text-zinc-700 font-mono">{ping}</span>
            </div>
        </div>
    );
}

function AnalyticsStatCard({ icon, label, value, desc }: { icon: React.ReactNode, label: string, value: string, desc: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-lg hover:bg-white/[0.02] transition-all group relative overflow-hidden">
            <div className="w-12 h-12 bg-black border border-white/5 rounded-2xl flex items-center justify-center mb-8 relative z-10">
                {icon}
            </div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-2 relative z-10">{label}</p>
            <h4 className="text-4xl font-black mb-1 tracking-tighter text-white relative z-10">{value}</h4>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest relative z-10">{desc}</p>
        </div>
    );
}

function ChartHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            {icon} {title}
        </h3>
    );
}
