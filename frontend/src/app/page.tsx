'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain, Search, Database, BarChart3, ArrowRight, Shield, Zap,
  FileText, MessageSquare, Layers, Eye, Lock, GitBranch, Upload
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-blue-500/30 overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Cognify PKM</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">Features</a>
            <a href="#pipeline" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">How it Works</a>
            <Link href="/auth/login" className="text-sm font-medium hover:text-blue-400 transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full -z-10" />
        <div className="absolute top-60 right-[-5%] w-[400px] h-[400px] bg-purple-700/8 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-40 left-[-5%] w-[300px] h-[300px] bg-emerald-700/8 blur-[100px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8">
              <Zap className="w-3 h-3" /> AI-Powered Knowledge Management
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-7 bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent"
          >
            Your Documents.<br />
            <span className="italic">Now Intelligent.</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Cognify PKM transforms your unstructured files — scanned PDFs, images, notes — into a
            searchable, queryable, and analyzable knowledge vault powered by state-of-the-art AI.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/signup"
              className="group w-full sm:w-auto bg-blue-600 px-8 py-4 rounded-full text-base font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-[0_0_40px_rgba(37,99,235,0.35)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)]"
            >
              Start For Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all"
            >
              Sign In →
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-20 grid grid-cols-3 gap-6 max-w-xl mx-auto"
          >
            {[
              { value: 'OCR', label: 'Powered Extraction' },
              { value: 'RAG', label: 'Global Chat Engine' },
              { value: '100%', label: 'Data Privacy' },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Your Knowledge Needs</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">From ingestion to insight — a complete intelligence layer for your documents.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Upload className="w-5 h-5 text-blue-400" />,
                color: 'blue',
                title: 'Smart Ingestion',
                desc: 'Upload PDFs, images, or plain text. OpenCV preprocessing and Tesseract OCR extract clean, structured text automatically.',
              },
              {
                icon: <Brain className="w-5 h-5 text-purple-400" />,
                color: 'purple',
                title: 'AI Summarization',
                desc: 'DistilBART distils every document into concise summaries and auto-classifies them with intelligent topic tags.',
              },
              {
                icon: <Search className="w-5 h-5 text-sky-400" />,
                color: 'sky',
                title: 'Semantic Search',
                desc: 'Find what you mean, not just what you typed. Sentence-BERT embeddings match concepts across your entire vault.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
                color: 'emerald',
                title: 'Global RAG Chat',
                desc: 'Ask questions across all your documents at once. RoBERTa retrieves answers with source citations from the best-matching pages.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
                color: 'amber',
                title: 'Knowledge Analytics',
                desc: 'Visualize topic evolution, storage growth, and upload trends with interactive Recharts dashboards.',
              },
              {
                icon: <FileText className="w-5 h-5 text-rose-400" />,
                color: 'rose',
                title: 'PDF Toolkit',
                desc: 'Split, merge, reorder, or remove pages from any PDF — all without leaving the app.',
              },
              {
                icon: <GitBranch className="w-5 h-5 text-indigo-400" />,
                color: 'indigo',
                title: 'Version Control',
                desc: 'Upload new versions of documents and trace the full lineage of changes over time.',
              },
              {
                icon: <Lock className="w-5 h-5 text-red-400" />,
                color: 'red',
                title: 'Sensitive Mode',
                desc: 'Mark confidential documents to exclude them from global analytics and search — fully isolated per user.',
              },
              {
                icon: <Eye className="w-5 h-5 text-teal-400" />,
                color: 'teal',
                title: 'Audit Logs',
                desc: 'Every action logged: uploads, queries, corrections, and version bumps — all tracked with timestamps.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i % 3}
                variants={fadeUp}
                className="p-7 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Pipeline ── */}
      <section id="pipeline" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From File to Intelligence</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Every document goes through a fully automated AI pipeline before it reaches your dashboard.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line connector */}
            <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/40 via-purple-500/20 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {[
                { step: '01', icon: <Upload className="w-4 h-4" />, color: 'blue', title: 'Upload', desc: 'User uploads PDF, PNG, JPG or TXT file via dashboard. File is saved to document storage and a processing task is queued via Celery + Redis.' },
                { step: '02', icon: <Eye className="w-4 h-4" />, color: 'purple', title: 'OCR Extraction', desc: 'OpenCV converts images to grayscale, applies denoising and thresholding. Tesseract extracts clean raw text from every page.' },
                { step: '03', icon: <Brain className="w-4 h-4" />, color: 'indigo', title: 'AI Processing', desc: 'DistilBART generates a concise summary. A zero-shot MNLI classifier assigns topic tags. Sentence-BERT generates a 384-dimensional semantic embedding vector.' },
                { step: '04', icon: <Database className="w-4 h-4" />, color: 'emerald', title: 'Storage', desc: 'All metadata, embeddings, summaries, and tags are persisted to the database. Document status is updated to COMPLETED.' },
                { step: '05', icon: <Search className="w-4 h-4" />, color: 'amber', title: 'Discovery', desc: 'Documents are instantly searchable by keyword, tag, date, or semantic similarity. The RAG engine can now include this document in global chat contexts.' },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex gap-6 items-start"
                >
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex flex-col items-center justify-center gap-0.5`}>
                    <div className={`text-${item.color}-400`}>{item.icon}</div>
                    <span className={`text-[10px] font-bold text-${item.color}-500/70`}>{item.step}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent border border-blue-500/20 p-14 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent -z-10" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build your intelligence layer?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            Join Cognify and transform a pile of documents into a living knowledge base you can actually talk to.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-blue-600 px-8 py-4 rounded-full text-base font-bold hover:bg-blue-500 transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)]"
          >
            Get Started — It's Free <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* ── Tech Stack Strip ── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-zinc-600 uppercase tracking-widest mb-8 font-semibold">Powered By</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-zinc-500 text-sm font-medium">
            {['Next.js 16', 'Django 5', 'HuggingFace Transformers', 'Tesseract OCR', 'Celery + Redis', 'SentenceTransformers', 'RoBERTa', 'OpenCV', 'Prometheus'].map((tech) => (
              <span key={tech} className="hover:text-zinc-300 transition-colors">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-base font-bold">Cognify PKM</span>
          </div>
          <p className="text-sm text-zinc-600">© 2026 Cognify AI Systems. Built for the era of intelligence.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
