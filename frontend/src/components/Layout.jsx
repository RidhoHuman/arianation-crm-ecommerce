import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import useCartStore from '../store/cartStore';
import useUIStore from '../store/uiStore';
import useCategoryStore from '../store/categoryStore';
import useCollectionStore from '../store/collectionStore';
import useProductTypeStore from '../store/productTypeStore';
import RewardBanner from './RewardBanner';
import SearchDrawer from './SearchDrawer';

export const getTranslatedCategoryName = (name, lang) => {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lang === 'ID') {
    if (lower.includes('everyday')) return 'Sehari-hari';
    if (lower.includes('heritage')) return 'Klasik (Heritage)';
    if (lower.includes('outdoor')) return 'Luar Ruang';
    if (lower.includes('street')) return 'Jalanan';
    if (lower.includes('active')) return 'Aktif';
  } else {
    if (lower.includes('everyday')) return 'Everyday';
    if (lower.includes('heritage')) return 'Heritage';
    if (lower.includes('outdoor')) return 'Outdoor';
    if (lower.includes('street')) return 'Street';
    if (lower.includes('active')) return 'Active';
  }
  return name;
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { logout } = useAuth();
  const [openMegaMenu, setOpenMegaMenu] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartItemCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0));
  
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';
  const isTransparent = isHomePage && !isScrolled;
  
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const isColorblindMode = useUIStore((s) => s.isColorblindMode);
  const toggleColorblindMode = useUIStore((s) => s.toggleColorblindMode);

  const toggleLanguage = () => setLanguage(language === 'ID' ? 'EN' : 'ID');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const TRANSLATIONS = {
    ID: {
      shop: 'Belanja',
      collection: 'Koleksi',
      customSablon: 'Sablon Kustom',
      about: 'Tentang Kami',
      login: 'Masuk',
      logout: 'Keluar',
      footerDesc: 'Pakaian jalanan premium yang dirancang untuk para pemberontak, pendukung, dan petualang. Lawan norma.',
      allProducts: 'Semua Produk',
      contactUs: 'Hubungi Kami',
      shippingReturns: 'Pengiriman & Pengembalian',
      support: 'Bantuan',
      points: 'POIN'
    },
    EN: {
      shop: 'Shop',
      collection: 'Collection',
      customSablon: 'Custom Sablon',
      about: 'About',
      login: 'Login',
      logout: 'Logout',
      footerDesc: 'Premium streetwear crafted for the rebels, the supporters, and the adventurers. Defy the norm.',
      allProducts: 'All Products',
      contactUs: 'Contact Us',
      shippingReturns: 'Shipping & Returns',
      support: 'Support',
      points: 'PTS'
    }
  };
  const t = TRANSLATIONS[language] || TRANSLATIONS.ID;

  const { categories, fetchCategories } = useCategoryStore();
  const { collections, fetchCollections } = useCollectionStore();
  const { types, fetchTypes } = useProductTypeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hydrate dari localStorage on mount
  useEffect(() => {
    console.log('🏠 Layout mounted - call hydrate()...');
    useAuthStore.getState().hydrate();
    fetchCategories({ businessType: 'FASHION_RETAIL' });
    fetchCollections();
    fetchTypes({ isActive: true });
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchCategories, fetchCollections, fetchTypes]);

  const handleLogout = async () => {
    console.log('🔓 Logout dipanggil');
    await logout();
    navigate('/login');
  };

  // Kategori untuk mega menu
  const activeCategories = categories.filter(c => c.isActive && c.businessType === 'FASHION_RETAIL');
  const activeCollections = collections.filter(c => c.isActive);

  const menuCategories = {
    shop: {
      title: 'SHOP',
      columns: {
        'By Category': activeCategories.map(cat => ({
          name: getTranslatedCategoryName(cat.categoryName || cat.name, language),
          href: `/products?category=${cat.slug || cat.id}`
        })),
        'By Type': types.filter(t => t.isActive).map(t => ({
          name: t.typeName,
          href: `/products?type=${t.slug}`
        })),
      }
    },
    collection: {
      title: 'COLLECTION',
      columns: {
        'All Collections': activeCollections.map(col => ({
          name: col.collectionName || col.name,
          href: `/products?collection=${col.slug || col.id}`
        })),
      }
    }
  };

  return (
    <div className="dark:bg-black min-h-screen flex flex-col transition-colors duration-300">
      <RewardBanner />
      <header className={`sticky w-full top-0 z-50 transition-all duration-500 ${isTransparent ? 'bg-transparent text-white border-transparent' : 'bg-white dark:bg-aria-charcoal text-aria-charcoal dark:text-white border-b border-aria-lightgray dark:border-gray-800 shadow-sm'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Left Side - Mobile Menu & Desktop Navigation */}
          <div className="flex-1 flex items-center justify-start">
            <button 
              className={`md:hidden p-1 -ml-1 transition-colors ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
            
            <nav className="hidden md:flex gap-4 lg:gap-8 text-[10px] lg:text-[11px] xl:text-xs font-medium tracking-[0.1em] xl:tracking-[0.15em] uppercase items-center relative">
              {/* SHOP Mega Menu */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setOpenMegaMenu('shop')}
                onMouseLeave={() => setOpenMegaMenu(null)}
              >
                <button className={`transition-colors py-6 px-1 ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}>
                  {t.shop}
                </button>
                {openMegaMenu === 'shop' && (
                  <div className="absolute top-full left-0 w-[600px] bg-white dark:bg-black border border-aria-lightgray dark:border-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-10 grid grid-cols-2 gap-10">
                      {Object.entries(menuCategories.shop.columns).map(([col, items]) => (
                        <div key={col}>
                          <h3 className="text-xs font-bold text-aria-charcoal dark:text-white mb-6 tracking-widest">{col}</h3>
                          <ul className="space-y-4">
                            {items.map((item) => (
                              <li key={item.name}>
                                <Link 
                                  to={item.href}
                                  onClick={() => setOpenMegaMenu(null)}
                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-aria-maroon dark:hover:text-white transition-colors"
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

              {/* COLLECTION Mega Menu */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setOpenMegaMenu('collection')}
                onMouseLeave={() => setOpenMegaMenu(null)}
              >
                <button className={`transition-colors py-6 px-1 ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}>
                  {t.collection}
                </button>
                {openMegaMenu === 'collection' && (
                  <div className="absolute top-full left-0 w-[400px] bg-white dark:bg-black border border-aria-lightgray dark:border-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-10">
                    {Object.entries(menuCategories.collection.columns).map(([col, items]) => (
                      <div key={col}>
                        <h3 className="text-xs font-bold text-aria-charcoal dark:text-white mb-6 tracking-widest">{col}</h3>
                        <ul className="space-y-4">
                          {items.map((item) => (
                            <li key={item.name}>
                              <Link 
                                to={item.href}
                                onClick={() => setOpenMegaMenu(null)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-aria-maroon dark:hover:text-white transition-colors"
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

              <Link to="/custom-sablon" className={`transition-colors py-6 px-1 ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}>
                {t.customSablon}
              </Link>

              <Link to="/about" className={`transition-colors py-6 px-1 ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}>
                {t.about}
              </Link>
            </nav>
          </div>

          {/* Center - Logo */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <Link to="/" className="flex items-center hover:opacity-70 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
              <img 
                src="/logo_AriaNation-removebg-preview.svg" 
                alt="Arianation Logo" 
                className="w-10 h-10 md:w-12 md:h-12 transition-all duration-300 object-contain"
              />
            </Link>
          </div>
          
          {/* Right Side - Auth, Toggles, Search & Cart */}
          <div className="flex-1 flex gap-3 sm:gap-5 text-[10px] lg:text-[11px] xl:text-xs font-medium tracking-widest uppercase items-center justify-end">
            
            <div className="flex items-center">
              <button 
                onClick={toggleLanguage}
                className={`transition-colors font-bold px-2 py-1 rounded ${isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-aria-maroon dark:hover:text-white'}`}
              >
                {language}
              </button>
            </div>

            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`transition-colors ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}
            >
              <Search className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 xl:gap-5">
                {user.rewardPoints !== undefined && (
                  <Link to="/account?tab=profile" className="hidden lg:inline-flex items-center gap-1 text-aria-maroon dark:text-yellow-400 font-bold bg-red-50 dark:bg-yellow-400/10 border border-aria-maroon/20 dark:border-yellow-400/30 px-2 py-1 rounded-sm text-[10px] hover:bg-red-100 dark:hover:bg-yellow-400/20 transition-colors">
                    {user.rewardPoints} {t.points}
                  </Link>
                )}
                <Link to={user.role === 'ADMIN' || user.role === 'OWNER' ? "/admin" : "/account"} className={`hidden md:inline-block transition-colors ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-gray-300 hover:text-aria-maroon dark:hover:text-white'}`}>
                  {user.role === 'ADMIN' || user.role === 'OWNER' ? 'Admin' : (language === 'ID' ? 'Akun' : 'Account')}
                </Link>
                <button
                  onClick={handleLogout}
                  className={`hidden md:inline-block transition-colors ${isTransparent ? 'text-white hover:text-red-300' : 'text-gray-500 hover:text-aria-maroon dark:hover:text-red-400'}`}
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link to="/login" className={`hidden md:inline-block transition-colors ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-gray-300 hover:text-aria-maroon dark:hover:text-white'}`}>
                {t.login}
              </Link>
            )}
            <Link to="/cart" className={`transition-colors flex items-center relative gap-2 ml-1 ${isTransparent ? 'text-white hover:text-gray-300' : 'text-aria-charcoal dark:text-white hover:text-aria-maroon dark:hover:text-gray-300'}`}>
              <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-aria-maroon text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-aria-charcoal border-b border-aria-lightgray dark:border-gray-800 shadow-xl flex flex-col py-2 px-6 z-40 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="flex flex-col gap-6 py-4">
              {/* Shop Section */}
              <div>
                <div className="font-bold text-sm tracking-widest mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 uppercase">{t.shop}</div>
                <div className="grid grid-cols-2 gap-4 pl-2">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-gray-500 mb-2 uppercase">By Category</div>
                    <div className="flex flex-col gap-3">
                      {menuCategories.shop.columns['By Category'].map(item => (
                        <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-aria-maroon dark:hover:text-gray-300">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-gray-500 mb-2 uppercase">By Type</div>
                    <div className="flex flex-col gap-3">
                      {menuCategories.shop.columns['By Type'].map(item => (
                        <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-aria-maroon dark:hover:text-gray-300">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection Section */}
              <div>
                <div className="font-bold text-sm tracking-widest mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 uppercase">{t.collection}</div>
                <div className="flex flex-col gap-3 pl-2">
                  {menuCategories.collection.columns['All Collections'].map(item => (
                    <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-aria-maroon dark:hover:text-gray-300">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col gap-5">
                <Link to="/custom-sablon" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-sm tracking-widest hover:text-aria-maroon dark:hover:text-gray-300 uppercase">
                  {t.customSablon}
                </Link>
                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-sm tracking-widest hover:text-aria-maroon dark:hover:text-gray-300 uppercase">
                  {t.about}
                </Link>

                {isAuthenticated && user && (
                  <Link 
                    to={user.role === 'ADMIN' || user.role === 'OWNER' ? "/admin" : "/account"} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="font-bold text-sm tracking-widest text-blue-600 dark:text-blue-400 hover:text-aria-maroon uppercase"
                  >
                    {user.role === 'ADMIN' || user.role === 'OWNER' ? 'Admin Panel' : (language === 'ID' ? 'Akun Saya' : 'My Account')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop/Tablet Search Bar Overlay */}
        <SearchDrawer 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />
      </header>

      <main className={`flex-grow w-full dark:bg-black dark:text-white transition-colors duration-300 ${!isHomePage ? '' : '-mt-20'}`}>
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-aria-charcoal text-aria-charcoal dark:text-gray-400 border-t border-aria-lightgray dark:border-gray-800 py-20 mt-20 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <img src="/logo AriaNation.svg" alt="Arianation Logo" className="w-12 h-12 mb-6 dark:bg-white dark:rounded-full dark:p-0.5 transition-colors" />
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                {t.footerDesc}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-aria-charcoal dark:text-white mb-6 tracking-widest uppercase">{t.shop}</h3>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/products" className="hover:text-aria-maroon dark:hover:text-white transition-colors">{t.allProducts}</Link></li>
                <li><Link to="/products" className="hover:text-aria-maroon dark:hover:text-white transition-colors">{t.collection}</Link></li>
                <li><Link to="/custom-sablon" className="hover:text-aria-maroon dark:hover:text-white transition-colors">{t.customSablon}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-aria-charcoal dark:text-white mb-6 tracking-widest uppercase">{t.support}</h3>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/contact" className="hover:text-aria-maroon dark:hover:text-white transition-colors">{t.contactUs}</Link></li>
                <li><Link to="/faq" className="hover:text-aria-maroon dark:hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/shipping" className="hover:text-aria-maroon dark:hover:text-white transition-colors">{t.shippingReturns}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-aria-lightgray dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 tracking-wider">&copy; {new Date().getFullYear()} ARIANATION. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
               <a href="#" className="text-xs text-gray-400 hover:text-aria-maroon dark:hover:text-white font-medium uppercase tracking-widest">Instagram</a>
               <a href="#" className="text-xs text-gray-400 hover:text-aria-maroon dark:hover:text-white font-medium uppercase tracking-widest">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
