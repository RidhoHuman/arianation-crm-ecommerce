'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminSidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('accessToken');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/orders', label: 'Orders', icon: '🛒' },
    { href: '/admin/design-requests', label: 'Design Requests', icon: '🎨' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/payments', label: 'Payments', icon: '💳' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col border-r border-gray-800`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {isExpanded && <h1 className="font-bold text-lg">ARIANATION</h1>}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-800 rounded transition"
        >
          {isExpanded ? '←' : '→'}
        </button>
      </div>

      {/* User Info */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-800 text-sm">
          <p className="font-semibold truncate">{user.fullName}</p>
          <p className="text-gray-400 text-xs">{user.role}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-3 transition ${
              isActive(item.href)
                ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
            title={!isExpanded ? item.label : ''}
          >
            <span className="text-xl">{item.icon}</span>
            {isExpanded && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-2 text-gray-300 hover:bg-red-600 hover:text-white rounded transition"
          title={!isExpanded ? 'Logout' : ''}
        >
          <span className="text-xl">🚪</span>
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
