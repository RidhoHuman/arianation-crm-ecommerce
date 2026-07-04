import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/admin/Dashboard';
import ProductList from './components/admin/ProductList';
import ProductForm from './components/admin/ProductForm';
import OrderList from './components/admin/OrderList';
import InventoryList from './components/admin/InventoryList';
import CategoryList from './components/admin/CategoryList';
import CollectionList from './components/admin/CollectionList';
import ProductTypeList from './components/admin/ProductTypeList';
import CustomerList from './components/admin/CustomerList';
import OrderDetail from './components/admin/OrderDetail';
import DesignReviewList from './components/admin/DesignReviewList';
import BannerList from './components/admin/BannerList';
import PromoEmailManager from './components/admin/PromoEmailManager';
import PortfolioManager from './components/admin/PortfolioManager';
import PrintTechniqueManager from './components/admin/PrintTechniqueManager';
import VoucherManager from './components/admin/VoucherManager';
import StoreSettingsManager from './components/admin/StoreSettingsManager';
import AdminReviews from './pages/admin/AdminReviews';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import PageTransition from './components/PageTransition';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/Home';
import AboutPage from './pages/About';
import AdminPage from './pages/Admin';
import CheckoutPage from './pages/Checkout';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import ProductsListing from './pages/ProductsListing';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import DesignRequest from './pages/DesignRequest';
import AccountPage from './pages/AccountPage';
import InvoicePage from './pages/InvoicePage';
import FAQPage from './pages/FAQPage';
import PortfolioPage from './pages/Portfolio';
import OAuthCallback from './pages/OAuthCallback';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route index element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
          <Route path="/products" element={<PageTransition><ProductsListing /></PageTransition>} />
          <Route path="/products/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
          <Route path="/categories" element={<Navigate to="/products" replace />} />
          <Route path="/categories/:slug" element={<PageTransition><CategoryPage /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
          <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
          <Route path="/order-tracking/:id" element={<PageTransition><OrderTracking /></PageTransition>} />
          <Route path="/invoice/:id" element={<PageTransition><InvoicePage /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
          <Route path="/account" element={<PageTransition><AccountPage /></PageTransition>} />
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          <Route path="/oauth-callback" element={<PageTransition><OAuthCallback /></PageTransition>} />
          <Route path="/custom-sablon" element={<PageTransition><DesignRequest /></PageTransition>} />
          <Route path="/sablon" element={<Navigate to="/custom-sablon" replace />} />
          <Route path="/portfolio" element={<PageTransition><PortfolioPage /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute requiredRole={['ADMIN', 'OWNER']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          
          {/* Retail E-Commerce Routes */}
          <Route path="retail/categories" element={<CategoryList businessType="FASHION_RETAIL" />} />
          <Route path="retail/types" element={<ProductTypeList />} />
          <Route path="retail/products" element={<ProductList businessType="FASHION_RETAIL" />} />
          <Route path="retail/products/add" element={<ProductForm defaultBusinessType="FASHION_RETAIL" />} />
          <Route path="retail/products/edit/:id" element={<ProductForm defaultBusinessType="FASHION_RETAIL" />} />
          <Route path="collections" element={<CollectionList />} />
          <Route path="banners" element={<BannerList />} />
          
          {/* Custom Sablon Routes */}
          <Route path="sablon/categories" element={<CategoryList businessType="SABLON_SERVICE" />} />
          <Route path="sablon/products" element={<ProductList businessType="SABLON_SERVICE" />} />
          <Route path="sablon/products/add" element={<ProductForm defaultBusinessType="SABLON_SERVICE" />} />
          <Route path="sablon/products/edit/:id" element={<ProductForm defaultBusinessType="SABLON_SERVICE" />} />
          <Route path="sablon/techniques" element={<PrintTechniqueManager />} />
          <Route path="sablon/portfolio" element={<PortfolioManager />} />
          
          {/* Common Routes */}
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="inventory" element={<InventoryList />} />
          
          {/* CRM & Review */}
          <Route path="customers" element={<CustomerList />} />
          <Route path="vouchers" element={<VoucherManager />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="promo-emails" element={<PromoEmailManager />} />
          <Route path="design-requests" element={<DesignReviewList />} />
          <Route path="settings" element={<StoreSettingsManager />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

import useUIStore from './store/uiStore';

import useCartStore from './store/cartStore';

export default function App() {
  // Hydrate auth store dari localStorage on app init
  useEffect(() => {
    console.log('🚀 App init - hydrate authStore');
    useAuthStore.getState().hydrate();
    useCartStore.getState().fetchCart();
  }, []);

  // Sync UI state to document elements for global CSS
  const theme = useUIStore((s) => s.theme);
  const isColorblindMode = useUIStore((s) => s.isColorblindMode);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (isColorblindMode) {
      root.classList.add('colorblind');
    } else {
      root.classList.remove('colorblind');
    }
  }, [theme, isColorblindMode]);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
