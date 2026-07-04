import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import useAuthStore from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import {
  FiPieChart,
  FiBox,
  FiShoppingCart,
  FiArchive,
  FiLogOut,
  FiSearch,
  FiHome,
  FiMenu,
  FiX,
  FiTag,
  FiLayers,
  FiUsers,
  FiImage,
  FiMail,
  FiSettings,
  FiStar
} from 'react-icons/fi';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Proteksi Akses
  if (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-400 mb-8">
            Halaman ini dikhususkan untuk Administrator Arianation.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
              Kembali ke Toko
            </Link>
            <Link to="/login" className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors">
              Login sebagai Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuGroups = [
    {
      title: '📦 RETAIL E-COMMERCE',
      items: [
        { id: 'retail-categories', path: '/admin/retail/categories', icon: <FiTag />, label: 'Kategori Retail' },
        { id: 'retail-types', path: '/admin/retail/types', icon: <FiTag />, label: 'Manajemen Tipe (By Type)' },
        { id: 'retail-products', path: '/admin/retail/products', icon: <FiBox />, label: 'Manajemen Produk Retail' },
        { id: 'collections', path: '/admin/collections', icon: <FiLayers />, label: 'Manajemen Koleksi' },
        { id: 'banners', path: '/admin/banners', icon: <FiImage />, label: 'Manajemen Banner' },
      ]
    },
    {
      title: '🖨️ CUSTOM SABLON',
      items: [
        { id: 'sablon-categories', path: '/admin/sablon/categories', icon: <FiTag />, label: 'Kategori Sablon' },
        { id: 'sablon-products', path: '/admin/sablon/products', icon: <FiBox />, label: 'Bahan Dasar Sablon' },
        { id: 'print-techniques', path: '/admin/sablon/techniques', icon: <FiLayers />, label: 'Manajemen Teknik Sablon' },
        { id: 'design-requests', path: '/admin/design-requests', icon: <FiImage />, label: 'Review Desain' },
        { id: 'sablon-portfolio', path: '/admin/sablon/portfolio', icon: <FiImage />, label: 'Portofolio Sablon' },
      ]
    },
    {
      title: '💰 PENJUALAN & STOK',
      items: [
        { id: 'orders', path: '/admin/orders', icon: <FiShoppingCart />, label: 'Pesanan Masuk' },
        { id: 'inventory', path: '/admin/inventory', icon: <FiArchive />, label: 'Inventaris Stok' },
      ]
    },
    {
      title: '👥 CUSTOMER & CRM',
      items: [
        { id: 'customers', path: '/admin/customers', icon: <FiUsers />, label: 'Pelanggan & Manajemen Poin' },
        { id: 'vouchers', path: '/admin/vouchers', icon: <FiTag />, label: 'Manajemen Kupon (Voucher)' },
        { id: 'promo-emails', path: '/admin/promo-emails', icon: <FiMail />, label: 'Kirim Newsletter / Promo' },
        { id: 'reviews', path: '/admin/reviews', icon: <FiStar />, label: 'Manajemen Ulasan' },
      ]
    },
    {
      title: '⚙️ PENGATURAN',
      items: [
        { id: 'settings', path: '/admin/settings', icon: <FiSettings />, label: 'Pengaturan Global' },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-aria-charcoal text-white shadow-xl h-full border-r border-white/5 overflow-y-auto">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6 p-6">
          <span className="font-black tracking-widest text-xl uppercase text-white">Arianation</span>
        </div>

        <div className="flex-1 py-4">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-6 py-3 mx-4 rounded-xl transition-all duration-200 mb-4 ${location.pathname === '/admin'
              ? 'bg-aria-maroon text-white font-medium shadow-md shadow-aria-maroon/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="text-xl"><FiPieChart /></span>
            Dashboard
          </Link>

          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <p className="px-6 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>
              <nav className="space-y-1 px-4">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-aria-maroon text-white font-medium shadow-md shadow-aria-maroon/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 mx-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-aria-maroon to-red-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.fullName || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
          >
            <FiLogOut className="text-lg" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 z-10">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-gray-500 text-2xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FiMenu />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
              {menuGroups.flatMap(g => g.items).find(i => location.pathname === i.path || (i.path !== '/admin' && location.pathname.startsWith(i.path)))?.label || (location.pathname === '/admin' ? 'Dashboard' : 'Arianation CRM')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <FiHome /> Lihat Web
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden flex" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-64 bg-aria-charcoal h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <span className="font-black tracking-widest text-lg uppercase text-white">Arianation</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white text-2xl transition-colors"><FiX /></button>
            </div>
            <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/admin' ? 'bg-aria-maroon text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="text-xl"><FiPieChart /></span>
                Dashboard
              </Link>
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="px-4 text-xs font-bold text-gray-500 uppercase">{group.title}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname.startsWith(item.path) ? 'bg-aria-maroon text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-white/5">
              <button onClick={handleLogout} className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-colors">
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
