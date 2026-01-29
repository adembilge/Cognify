'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, ArrowRight, Github } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/auth/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (res.ok) {
                router.push('/auth/login');
            } else {
                const data = await res.json();
                setError(JSON.stringify(data));
            }
        } catch (err) {
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden" suppressHydrationWarning>
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full -z-10" />

            <Link href="/" className="mb-12 flex items-center gap-2 group">
                <Brain className="w-8 h-8 text-blue-600 group-hover:rotate-12 transition-transform" />
                <span className="text-2xl font-bold tracking-tight">Cognify PKM</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl"
            >
                <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-zinc-500 mb-8">Begin your journey into intelligent knowledge management.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="johndoe"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span></div>
                </div>

                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all">
                    <Github className="w-5 h-5" /> GitHub
                </button>

                <p className="mt-8 text-center text-sm text-zinc-500">
                    Already have an account? {' '}
                    <Link href="/auth/login" className="text-blue-500 hover:underline font-semibold">Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
}
