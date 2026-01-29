'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
    Brain, FileText, LayoutDashboard, Settings,
    BarChart3, Scissors, LogOut, Clock, Star
} from 'lucide-react';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        router.push('/');
    };

    return (
        <aside className={`fixed left-0 top-0 h-full bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-6 flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                {isOpen && <span className="text-xl font-bold text-white tracking-tight">Cognify</span>}
            </div>

            <nav className="px-3 space-y-2">
                <NavItem
                    icon={<LayoutDashboard />}
                    label="Dashboard"
                    active={pathname === '/dashboard'}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard')}
                />
                <NavItem
                    icon={<BarChart3 />}
                    label="Analytics"
                    active={pathname === '/dashboard/analytics'}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard/analytics')}
                />
                <NavItem
                    icon={<Scissors />}
                    label="PDF Tools"
                    active={pathname === '/dashboard/pdf-tools'}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard/pdf-tools')}
                />
                <NavItem
                    icon={<Brain />}
                    label="Neural Chat"
                    active={pathname === '/dashboard/chat'}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard/chat')}
                />
                <NavItem
                    icon={<Star />}
                    label="Highlights"
                    active={pathname === '/dashboard/highlights'}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard/highlights')}
                />
                <NavItem
                    icon={<FileText />}
                    label="All Documents"
                    active={pathname.includes('/documents')}
                    isOpen={isOpen}
                    onClick={() => router.push('/dashboard')}
                />

                <div className="pt-10">
                    <NavItem
                        icon={<LogOut />}
                        label="Logout"
                        isOpen={isOpen}
                        onClick={handleLogout}
                    />
                </div>
            </nav>

            <div className="absolute bottom-6 left-0 w-full px-6">
                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white">
                        V
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">Vault User</p>
                            <p className="text-xs text-zinc-500 truncate">Core Access</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false, isOpen = true, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group
                ${active ? 'bg-blue-600/10 text-blue-500 shadow-sm' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}
            `}
        >
            <div className={`shrink-0 ${active ? 'text-blue-500' : 'group-hover:scale-110 transition-transform'}`}>
                {icon}
            </div>
            {isOpen && <span className="text-sm font-bold tracking-tight">{label}</span>}
        </div>
    );
}
