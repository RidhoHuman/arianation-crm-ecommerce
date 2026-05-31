import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { clearAuth } = useAuth();
  const [openMegaMenu, setOpenMegaMenu] = useState(null);

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

  // Kategori untuk mega menu
  const menuCategories = {
    shop: {
      title: 'SHOP',
      columns: {
        'By Category': [
          { name: 'Supporter Culture', href: '/products?category=supporter' },
          { name: 'Outdoor', href: '/products?category=outdoor' },
          { name: 'Fishing', href: '/products?category=fishing' },
          { name: 'Running', href: '/products?category=running' },
        ],
        'By Type': [
          { name: 'T-Shirts', href: '/products?type=tshirt' },
          { name: 'Hoodies', href: '/products?type=hoodie' },
          { name: 'Pants', href: '/products?type=pants' },
          { name: 'Accessories', href: '/products?type=accessories' },
        ],
      }
    },
    collection: {
      title: 'COLLECTION',
      columns: {
        'Featured': [
          { name: 'New Arrivals', href: '/products?sort=new' },
          { name: 'Best Sellers', href: '/products?sort=bestseller' },
          { name: 'Limited Edition', href: '/products?filter=limited' },
          { name: 'On Sale', href: '/products?filter=sale' },
        ],
      }
    }
  };

  return (
    <>
      <header className="bg-white text-black sticky top-0 z-50 border-b border-aria-lightgray">
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
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex gap-8 text-xs font-bold tracking-wider uppercase items-center relative">
            {/* SHOP Mega Menu */}
            <div 
              className="relative group"
              onMouseEnter={() => setOpenMegaMenu('shop')}
              onMouseLeave={() => setOpenMegaMenu(null)}
            >
              <button className="text-black hover:text-aria-charcoal transition-colors py-4">
                Shop
              </button>
              {openMegaMenu === 'shop' && (
                <div className="absolute left-0 mt-0 w-96 bg-white border border-aria-lightgray shadow-lg p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {Object.entries(menuCategories.shop.columns).map(([col, items]) => (
                      <div key={col}>
                        <h3 className="text-xs font-bold text-aria-charcoal mb-4 tracking-wider">{col}</h3>
                        <ul className="space-y-3">
                          {items.map((item) => (
                            <li key={item.name}>
                              <Link 
                                to={item.href}
                                onClick={() => setOpenMegaMenu(null)}
                                className="text-sm text-gray-700 hover:text-black transition-colors"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLLECTION Mega Menu */}
            <div 
              className="relative group"
              onMouseEnter={() => setOpenMegaMenu('collection')}
              onMouseLeave={() => setOpenMegaMenu(null)}
            >
              <button className="text-black hover:text-aria-charcoal transition-colors py-4">
                Collection
              </button>
              {openMegaMenu === 'collection' && (
                <div className="absolute left-0 mt-0 w-80 bg-white border border-aria-lightgray shadow-lg p-8">
                  {Object.entries(menuCategories.collection.columns).map(([col, items]) => (
                    <div key={col}>
                      <h3 className="text-xs font-bold text-aria-charcoal mb-4 tracking-wider">{col}</h3>
                      <ul className="space-y-3">
                        {items.map((item) => (
                          <li key={item.name}>
                            <Link 
                              to={item.href}
                              onClick={() => setOpenMegaMenu(null)}
                              className="text-sm text-gray-700 hover:text-black transition-colors"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link to="/sablon" className="text-black hover:text-aria-charcoal transition-colors">
              Custom Sablon
            </Link>
          </nav>

          {/* Right Side - Auth & Cart */}
          <div className="flex gap-6 text-xs font-bold tracking-wider uppercase items-center">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-aria-charcoal">👤 {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-aria-charcoal transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-black hover:text-aria-charcoal transition-colors">
                Login
              </Link>
            )}
            <Link to="/checkout" className="text-black hover:text-aria-charcoal transition-colors text-xl">
              🛒
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <footer className="bg-aria-charcoal text-aria-cream border-t border-aria-darkgray py-16 mt-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-aria-cream mb-4 tracking-wider">ABOUT</h3>
              <p className="text-sm text-gray-400">Arianation - Premium streetwear for casual supporters and football enthusiasts.</p>
            </div>
            <div>
              <h3 className="font-bold text-aria-cream mb-4 tracking-wider">SHOP</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/products" className="hover:text-aria-cream transition">All Products</a></li>
                <li><a href="/products?category=supporter" className="hover:text-aria-cream transition">Supporter Culture</a></li>
                <li><a href="/sablon" className="hover:text-aria-cream transition">Custom Sablon</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-aria-cream mb-4 tracking-wider">CUSTOMER</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/contact" className="hover:text-aria-cream transition">Contact</a></li>
                <li><a href="/faq" className="hover:text-aria-cream transition">FAQ</a></li>
                <li><a href="/shipping" className="hover:text-aria-cream transition">Shipping</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-aria-cream mb-4 tracking-wider">LEGAL</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/privacy" className="hover:text-aria-cream transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-aria-cream transition">Terms</a></li>
                <li><a href="/returns" className="hover:text-aria-cream transition">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-aria-darkgray pt-8 text-center">
            <p className="text-xs text-gray-500 tracking-wider">&copy; {new Date().getFullYear()} ARIANATION. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
