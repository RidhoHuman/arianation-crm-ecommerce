import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

// Sub-components
import ProductList from '../components/admin/ProductList';
import ProductForm from '../components/admin/ProductForm';
import OrderList from '../components/admin/OrderList';
import OrderDetail from '../components/admin/OrderDetail';
import InventoryList from '../components/admin/InventoryList';
import Dashboard from '../components/admin/Dashboard';
import AdminSettings from '../components/admin/AdminSettings';

export default function AdminPage() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin' },
    { id: 'products', label: 'Produk', icon: '📦', path: '/admin/products' },
    { id: 'orders', label: 'PO Orders', icon: '🛒', path: '/admin/orders' },
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/admin/inventory' },
    { id: 'settings', label: 'Pengaturan', icon: '⚙️', path: '/admin/settings' },
  ];

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes('/products')) {
      setActiveTab('products');
    } else if (path.includes('/orders')) {
      setActiveTab('orders');
    } else if (path.includes('/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Check if user is admin/owner
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki akses ke halaman admin. Hubungi administrator.
          </p>
          <Link to="/" className="text-blue-600 hover:underline">
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-aria-charcoal text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Arianation Admin</h1>
              <p className="text-gray-300 text-sm mt-1">
                Welcome, {user.fullName || user.email} ({user.role})
              </p>
            </div>
            <Link
              to="/"
              className="bg-white text-aria-charcoal px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`px-6 py-4 font-medium transition flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-aria-charcoal text-aria-charcoal'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </div>
  );
}