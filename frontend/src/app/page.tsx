'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Search, Database, BarChart3, ArrowRight, Shield, Zap, Share2 } from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050505]" />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Cognify PKM</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium hover:text-blue-400 transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-zinc-100 text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
              <Zap className="w-3 h-3" /> AI-Powered Knowledge Management
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent italic">
              Knowledge is Static.<br />Intelligence is Fluid.
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Cognify PKM transforms your raw documents into a living intelligence layer.
              Extract insights, search semantically, and visualize your knowledge trends with state-of-the-art AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="group w-full sm:w-auto bg-blue-600 px-8 py-4 rounded-full text-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.4)]"
              >
                Start building your knowledge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold border border-white/10 hover:bg-white/5 transition-all">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="w-6 h-6 text-blue-500" />}
              title="Semantic Discovery"
              description="Forget keywords. Search your knowledge base with natural language and find exact concepts buried in thousands of pages."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-purple-500" />}
              title="Automated Insight"
              description="Our AI pipelines automatically classify, tag, and summarize every document, saving you hundreds of hours of manual reading."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-emerald-500" />}
              title="Knowledge Analytics"
              description="Visualize trends, topic growth, and knowledge density over time with our intuitive interactive dashboard."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold">Cognify PKM</span>
          </div>
          <p className="text-sm text-zinc-500">© 2026 Cognify AI Systems. Built for the era of intelligence.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
