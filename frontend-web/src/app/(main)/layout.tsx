'use client';

import { useState } from 'react';
import { Sidebar, SidebarToggle } from '@/components/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 md:ml-64">
        {/* Mobile menu toggle */}
        <SidebarToggle onClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
