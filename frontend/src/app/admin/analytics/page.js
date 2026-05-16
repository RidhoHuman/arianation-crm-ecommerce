'use client';

import { useEffect, useState } from 'react';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    sales: null,
    revenue: null,
    orders: null,
    customers: null,
    designs: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const headers = {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        };

        const [salesRes, revenueRes, ordersRes, customersRes, designsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/admin/analytics/sales?days=${days}`, headers),
          fetch(`http://localhost:3001/api/admin/analytics/revenue?days=${days}`, headers),
          fetch(`http://localhost:3001/api/admin/analytics/orders?days=${days}`, headers),
          fetch(`http://localhost:3001/api/admin/analytics/customers?days=${days}`, headers),
          fetch(`http://localhost:3001/api/admin/analytics/designs?days=${days}`, headers),
        ]);

        const data = {
          sales: salesRes.ok ? (await salesRes.json()).data : null,
          revenue: revenueRes.ok ? (await revenueRes.json()).data : null,
          orders: ordersRes.ok ? (await ordersRes.json()).data : null,
          customers: customersRes.ok ? (await customersRes.json()).data : null,
          designs: designsRes.ok ? (await designsRes.json()).data : null,
        };

        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Business metrics and insights</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Sales Analytics */}
      {analytics.sales && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Sales Analytics</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{analytics.sales.summary.totalOrders}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{analytics.sales.summary.totalItems}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.sales.summary.totalRevenue)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Daily Breakdown</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analytics.sales.data.map((day, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{day.date}</span>
                  <span>{day.orders} orders • {day.items} items • {formatCurrency(day.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analytics */}
      {analytics.revenue && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Analytics</h2>
          <div className="mb-4 p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(analytics.revenue.totalRevenue)}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">By Category</p>
              <div className="space-y-2">
                {analytics.revenue.byCategory.map((cat, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{cat.category}</span>
                    <span>{formatCurrency(cat.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">By Payment Method</p>
              <div className="space-y-2">
                {analytics.revenue.byPaymentMethod.map((method, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{method.method}</span>
                    <span>{formatCurrency(method.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Analytics */}
      {analytics.orders && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Order Analytics</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{analytics.orders.summary.totalOrders}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.orders.summary.avgOrderValue)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">By Status</p>
            <div className="space-y-2">
              {analytics.orders.byStatus.map((status, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{status.status}</span>
                  <span>{status.count} orders • {formatCurrency(status.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {analytics.customers && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Customer Analytics</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{analytics.customers.totalCustomers}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">New Customers</p>
              <p className="text-2xl font-bold">{analytics.customers.newCustomers}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Top Customers</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analytics.customers.topCustomers.map((cust, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{cust.name}</span>
                  <span>{cust.orderCount} orders • {formatCurrency(cust.totalSpent)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Design Analytics */}
      {analytics.designs && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Design Analytics</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Designs</p>
              <p className="text-2xl font-bold">{analytics.designs.totalDesigns}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold">{analytics.designs.approvalRate}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">By Status</p>
            <div className="space-y-2">
              {analytics.designs.byStatus.map((status, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{status.status}</span>
                  <span>{status.count} designs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
