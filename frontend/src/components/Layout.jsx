import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => {
    console.log('📊 Zustand selector user:', s.user?.email, 'isAuth:', s.isAuthenticated);
    return s.user;
  });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { clearAuth } = useAuth();

  // Log setiap kali component render
  useEffect(() => {
    console.log('🎨 Layout rendered - user:', user?.email, 'isAuth:', isAuthenticated);
  }, [user, isAuthenticated]);

  // Hydrate dari localStorage on mount
  useEffect(() => {
    console.log('🏠 Layout mounted - call hydrate()...');
    useAuthStore.getState().hydrate();
  }, []);

  const handleLogout = () => {
    console.log('🔓 Logout dipanggil');
    clearAuth();
    navigate('/login');
  };

  console.log('🔍 Current render state - user:', user?.email, 'isAuth:', isAuthenticated);

  return (
    <>
      <header className="bg-white text-black sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-70 transition-opacity">
            <img 
              src="/logo AriaNation.svg" 
              alt="Arianation Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
            />
          </Link>
          
          <nav className="hidden md:flex gap-8 text-xs font-semibold tracking-wide uppercase">
            <Link to="/" className="text-black hover:text-gray-600 transition-colors">Shop</Link>
            <Link to="/products" className="text-black hover:text-gray-600 transition-colors">Collection</Link>
            <Link to="/sablon" className="text-black hover:text-gray-600 transition-colors">Custom Sablon</Link>
          </nav>
          <div className="flex gap-6 text-xs font-semibold tracking-wide uppercase items-center">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-600">👤 {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-black hover:text-gray-600 transition-colors">Login</Link>
            )}
            <Link to="/checkout" className="text-black hover:text-gray-600 transition-colors text-xl">🛒</Link>
          </div>
        </div>
      </header>
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <footer className="bg-white text-black border-t border-gray-200 py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs tracking-wide">&copy; {new Date().getFullYear()} ARIANATION. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </>
  );
}
