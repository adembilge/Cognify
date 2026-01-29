'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#050505]">
            <Sidebar isOpen={isSidebarOpen} />
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {children}
            </div>
        </div>
    );
}
