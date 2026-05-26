import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import '../app/globals.css';

export default function Layout() {
  return (
    <html lang="id" className="antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased bg-white">
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
              <Link to="/login" className="text-black hover:text-gray-600 transition-colors">Login</Link>
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
      </body>
    </html>
  );
}
