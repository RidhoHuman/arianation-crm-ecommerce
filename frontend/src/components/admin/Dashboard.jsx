import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, Users, Gift, Eye, Clock, Calendar, AlertTriangle
} from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../../services/api';

const COLORS = ['#1f2937', '#991b1b', '#e5e7eb', '#3b82f6']; // Charcoal, Maroon, Gray, Blue

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('7'); // 7, 14, 30
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 0,
      revenueChange: 0,
      newOrders: 0,
      newCustomers: 0,
      crmPerformance: 0,
      lowStockProducts: 0
    },
    revenueTrends: [],
    salesProportion: [
      { name: 'Retail', value: 0 },
      { name: 'Sablon Kustom', value: 0 }
    ],
    recentOrders: [],
    activities: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      const dateParams = {
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString()
      };

      // Fetch parallel
      const [fulfillmentRes, revenueRes, usersRes, inventoryRes, activitiesRes] = await Promise.all([
        api.get('/analytics/fulfillment', { params: dateParams }).catch(() => ({ data: { data: {} } })),
        api.get('/analytics/revenue', { params: dateParams }).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/admin/inventory/analytics').catch(() => ({ data: { data: {} } })),
        api.get('/analytics/activities', { params: { limit: 10 } }).catch(() => ({ data: { data: [] } }))
      ]);

      const fulfillment = fulfillmentRes?.data?.data || {};
      const revenue = revenueRes?.data?.data || {};
      const users = usersRes?.data?.data || [];
      const inventoryAnalytics = inventoryRes?.data?.data || {};
      const recentActivities = activitiesRes?.data?.data || [];

      // Transform revenue data for chart
      const chartData = (revenue.data || []).map(item => ({
        date: format(new Date(item.date), 'dd MMM', { locale: id }),
        pendapatan: item.revenue,
        pesanan: item.orders
      }));

      // Calculate recent orders
      const recent = fulfillment.recentOrders || [];

      // Calculate new orders (pending)
      const pendingOrders = fulfillment.statusDistribution?.PENDING || 0;

      // Update state
      setDashboardData(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          totalRevenue: fulfillment.summary?.totalRevenue || 0,
          revenueChange: 0, // Pending backend support for comparative data
          newOrders: pendingOrders,
          newCustomers: users.length,
          crmPerformance: 0, // Pending backend support for explicit CRM metrics
          lowStockProducts: inventoryAnalytics?.inventory?.lowStockProducts || 0
        },
        revenueTrends: chartData,
        salesProportion: [
          { name: 'Retail E-Commerce', value: fulfillment.summary?.retailRevenue || fulfillment.summary?.totalRevenue || 0 },
          { name: 'Custom Sablon', value: fulfillment.summary?.sablonRevenue || 0 }
        ],
        recentOrders: recent,
        activities: recentActivities,
      }));

    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'READY_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
      'SHIPPED': 'bg-sky-100 text-sky-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    const colorClass = statusMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan performa bisnis Arianation Anda.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-500 ml-2" />
          <select 
            className="bg-transparent text-sm font-medium focus:outline-none py-1 pr-2 cursor-pointer"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">7 Hari Terakhir</option>
            <option value="14">14 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Inventory Stock Warning Banner */}
      {!loading && dashboardData.summary.lowStockProducts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse-slow">
          <div className="bg-red-100 p-2 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-red-800 font-bold text-sm">Peringatan Stok Menipis!</h3>
            <p className="text-red-600 text-sm mt-0.5">
              Terdapat <strong>{dashboardData.summary.lowStockProducts} produk</strong> dengan stok di bawah batas aman (kurang dari 10). 
              Segera periksa inventaris dan lakukan restock untuk menghindari kehilangan potensi penjualan.
            </p>
          </div>
          <div className="ml-auto pl-3">
            <Link to="/admin/inventory" className="text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap inline-block">
              Cek Inventoris
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aria-charcoal"></div>
        </div>
      ) : (
        <>
          {/* Row 1: Key Metrics (4 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Pendapatan</p>
                  <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.totalRevenue)}</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium flex items-center">
                  +{dashboardData.summary.revenueChange}%
                </span>
                <span className="text-gray-400 ml-2">vs bulan lalu</span>
              </div>
            </div>

            {/* New Orders */}
            <div className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between ${dashboardData.summary.newOrders > 0 ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pesanan Baru (Menunggu)</p>
                  <h3 className="text-2xl font-bold text-gray-900">{dashboardData.summary.newOrders}</h3>
                </div>
                <div className={`${dashboardData.summary.newOrders > 0 ? 'bg-orange-100' : 'bg-gray-100'} p-2 rounded-lg`}>
                  <ShoppingBag className={`w-5 h-5 ${dashboardData.summary.newOrders > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
                </div>
              </div>
              <div className="mt-4 text-sm">
                {dashboardData.summary.newOrders > 0 ? (
                  <span className="text-orange-600 font-medium">Butuh aksi segera!</span>
                ) : (
                  <span className="text-gray-400">Semua pesanan tertangani</span>
                )}
              </div>
            </div>

            {/* New Customers */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Kustomer Baru</p>
                  <h3 className="text-2xl font-bold text-gray-900">{dashboardData.summary.newCustomers}</h3>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-gray-500">Pendaftar baru dalam {dateRange} hari</span>
              </div>
            </div>

            {/* CRM Performance */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Performa CRM (Diskon)</p>
                  <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.crmPerformance)}</h3>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-700" />
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-gray-500">Voucher & Poin terpakai</span>
              </div>
            </div>
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend (70%) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Penjualan</h3>
              <div className="h-[300px] w-full flex items-center justify-center relative">
                {dashboardData.revenueTrends.length === 0 ? (
                  <p className="text-gray-400 text-sm absolute">Belum ada data transaksi untuk rentang waktu ini</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.revenueTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis 
                        yAxisId="left" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#6b7280' }} 
                        tickFormatter={(value) => `Rp${value / 1000000}M`}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="pendapatan" stroke="#1f2937" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Sales Proportion (30%) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Proporsi Penjualan</h3>
              <div className="h-[300px] w-full flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={dashboardData.salesProportion}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.salesProportion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      formatter={(value) => <span className="ml-1.5 text-gray-700 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Recent Orders & Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders Table (Takes up 2 columns on large screens) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Transaksi Terakhir</h3>
                <Link to="/admin/orders" className="text-sm font-medium text-aria-charcoal hover:underline">
                  Lihat Semua
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">ID Pesanan</th>
                      <th className="px-6 py-3 font-medium">Kustomer</th>
                      <th className="px-6 py-3 font-medium">Total Harga</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardData.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 text-xs">
                          {order.orderNumber || (order.id.length > 20 ? `#${order.id.substring(0, 8)}...${order.id.slice(-4)}` : `#${order.id}`)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.customerName || 'Kustomer Guest'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-aria-charcoal hover:bg-gray-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dashboardData.recentOrders.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Belum ada pesanan terbaru.
                  </div>
                )}
              </div>
            </div>

            {/* Activity Log (Takes 1 column) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Aktivitas Sistem</h3>
              <div className="flex-1">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {dashboardData.activities.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 relative z-10 bg-white">Belum ada aktivitas terekam.</div>
                  ) : (
                    dashboardData.activities.map((activity) => (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-gray-200 text-gray-500 group-[.is-active]:bg-aria-charcoal group-[.is-active]:text-white shadow shrink-0 z-10">
                          <Clock className="w-3 h-3" />
                        </div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-100 bg-white shadow-sm ml-4 md:ml-0">
                          <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] font-medium text-gray-400">
                              {activity.userName || activity.userEmail || 'Sistem'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: id })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
