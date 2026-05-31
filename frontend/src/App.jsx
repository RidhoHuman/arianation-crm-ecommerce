import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';
import HomePage from './pages/Home';
import AdminPage from './pages/Admin';
import CheckoutPage from './pages/Checkout';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import ProductsListing from './pages/ProductsListing';

export default function App() {
  // Hydrate auth store dari localStorage on app init
  useEffect(() => {
    console.log('🚀 App init - hydrate authStore');
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/products" element={<ProductsListing />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
