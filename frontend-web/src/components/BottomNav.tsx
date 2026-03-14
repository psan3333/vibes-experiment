'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', icon: '🗺️', label: 'Map', active: pathname === '/' },
    { href: '/messages', icon: '💬', label: 'Messages', active: pathname.startsWith('/messages') },
    { href: '/profile', icon: '👤', label: 'Profile', active: pathname.startsWith('/profile') },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              item.active 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium mt-0.5">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
