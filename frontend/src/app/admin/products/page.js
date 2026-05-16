'use client';

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    stockQuantity: '',
    productType: 'CLOTHING',
    businessType: 'SABLON',
  });

  const fetchProducts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(search && { search })
      });

      const response = await fetch(`http://localhost:3001/api/admin/products?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `http://localhost:3001/api/admin/products/${editingId}`
        : 'http://localhost:3001/api/admin/products';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
        })
      });

      if (!response.ok) throw new Error('Failed to save product');

      setShowForm(false);
      setEditingId(null);
      setFormData({
        productName: '',
        description: '',
        price: '',
        stockQuantity: '',
        productType: 'CLOTHING',
        businessType: 'SABLON',
      });
      fetchProducts(1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete product');
      fetchProducts(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'productName', label: 'Name' },
    { key: 'productType', label: 'Type' },
    { key: 'price', label: 'Price', render: (v) => formatCurrency(v) },
    { key: 'stockQuantity', label: 'Stock' },
    { key: 'businessType', label: 'Business Type' },
    { key: 'isActive', label: 'Active', render: (v) => v ? '✅' : '❌' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              productName: '',
              description: '',
              price: '',
              stockQuantity: '',
              productType: 'CLOTHING',
              businessType: 'SABLON',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Price"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CLOTHING">CLOTHING</option>
              <option value="ACCESSORY">ACCESSORY</option>
            </select>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SABLON">SABLON</option>
              <option value="FASHION">FASHION</option>
            </select>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <button
              type="submit"
              className="md:col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchProducts}
        actions={[
          {
            label: 'Edit',
            color: '#3b82f6',
            onClick: (row) => {
              setEditingId(row.id);
              setFormData(row);
              setShowForm(true);
            }
          },
          {
            label: 'Delete',
            color: '#ef4444',
            onClick: (row) => handleDelete(row.id)
          }
        ]}
      />
    </div>
  );
}
