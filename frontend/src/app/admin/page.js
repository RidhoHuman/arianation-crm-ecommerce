'use client';

import { useEffect, useState } from 'react';
import StatsCard from './components/StatsCard';
import DataTable from './components/DataTable';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/admin/dashboard', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard');

        const data = await response.json();
        setDashboard(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">Error: {error}</div>;
  }

  if (!dashboard) return null;

  const recentOrderColumns = [
    { key: 'orderNumber', label: 'Order #' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded ${
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
          status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
          status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'totalAmount', label: 'Amount', render: (v) => formatCurrency(v) },
    { key: 'itemCount', label: 'Items', render: (v) => `${v} items` },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString('id-ID') },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Arianation Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon="📊"
          title="Today's Orders"
          value={dashboard.orders.today}
          color="blue"
        />
        <StatsCard
          icon="💰"
          title="Total Revenue"
          value={formatCurrency(dashboard.revenue.total)}
          color="green"
        />
        <StatsCard
          icon="👥"
          title="Total Customers"
          value={dashboard.customers.total}
          color="purple"
        />
        <StatsCard
          icon="🎨"
          title="Pending Designs"
          value={dashboard.designs.pending}
          color="orange"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsCard
          icon="📦"
          title="Month's Orders"
          value={dashboard.orders.month}
          subtitle={`Total: ${dashboard.orders.total} all-time`}
          color="blue"
        />
        <StatsCard
          icon="⭐"
          title="Top Product"
          value={dashboard.topProducts[0]?.productName || 'N/A'}
          subtitle={`${dashboard.topProducts[0]?.count || 0} sales`}
          color="purple"
        />
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <DataTable
          columns={recentOrderColumns}
          data={dashboard.recentOrders}
        />
      </div>
    </div>
  );
}
