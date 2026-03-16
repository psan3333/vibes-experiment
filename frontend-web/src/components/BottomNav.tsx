'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const navItems = [
    { 
      href: '/discover', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      ), 
      label: 'Discover', 
      active: pathname === '/discover' || pathname === '/',
    },
    { 
      href: '/messages', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ), 
      label: 'Messages', 
      active: pathname.startsWith('/messages'),
    },
    ...(user?.is_organizer ? [{ 
      href: '/admin', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18v18H3zM12 8v8m-4-4h8"></path>
        </svg>
      ), 
      label: 'Admin', 
      active: pathname.startsWith('/admin'),
    }] : []),
    { 
      href: '/profile', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ), 
      label: 'Profile', 
      active: pathname.startsWith('/profile'),
    },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
              item.active 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${item.active ? 'bg-primary/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
