import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
];

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;

        const response = await api.get('/orders', { params });
        setOrders(response.data.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal memuat daftar PO');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter]);

  const refreshOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/orders', { params });
      setOrders(response.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal menyegarkan daftar PO');
    }
  };

  const updateOrder = async (orderId, action) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    setMessage(null);

    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: action });
      setMessage(response.data?.message || 'Status pesanan berhasil diperbarui');
      await refreshOrders();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal mengubah status PO');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const cancelOrder = async (orderId) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    setMessage(null);

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason: 'Admin canceled' });
      setMessage(response.data?.message || 'Pesanan dibatalkan');
      await refreshOrders();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal membatalkan PO');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getActionButtons = (order) => {
    const isLoading = actionLoading[order.id];
    return (
      <div className="flex flex-wrap gap-2">
        {order.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => updateOrder(order.id, 'CONFIRMED')}
              disabled={isLoading}
              className="rounded-full bg-aria-charcoal px-3 py-2 text-xs font-semibold text-white hover:bg-aria-maroon disabled:opacity-60"
            >
              Konfirmasi
            </button>
            <button
              type="button"
              onClick={() => cancelOrder(order.id)}
              disabled={isLoading}
              className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Batalkan
            </button>
          </>
        )}
        {order.status === 'confirmed' && (
          <>
            <button
              type="button"
              onClick={() => updateOrder(order.id, 'SHIPPED')}
              disabled={isLoading}
              className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Kirim
            </button>
            <button
              type="button"
              onClick={() => cancelOrder(order.id)}
              disabled={isLoading}
              className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Batalkan
            </button>
          </>
        )}
        {order.status === 'shipped' && (
          <button
            type="button"
            onClick={() => updateOrder(order.id, 'DELIVERED')}
            disabled={isLoading}
            className="rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            Tandai Diterima
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Semua Pesanan</h1>
          <p className="text-sm text-gray-500">Kelola pesanan pelanggan dan jalankan proses konfirmasi, pengiriman, serta penerimaan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <label className="mr-2 font-semibold">Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={refreshOrders}
            className="rounded-full bg-aria-charcoal px-5 py-2 text-sm font-semibold text-white hover:bg-aria-maroon"
          >
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center py-12">Memuat daftar pesanan...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
          Tidak ada pesanan dengan status ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">ID PO</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-200 bg-white">
                  <td className="px-4 py-4 font-semibold text-gray-900">{order.id}</td>
                  <td className="px-4 py-4 text-gray-700">
                    {order.product?.productName || order.productId || '—'}
                  </td>
                  <td className="px-4 py-4 text-gray-700">{order.customerId || 'Guest'}</td>
                  <td className="px-4 py-4 text-gray-700">{order.quantity}</td>
                  <td className="px-4 py-4 text-gray-700">
                    {order.pricePerUnit ? `Rp ${order.pricePerUnit.toLocaleString('id-ID')}` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : order.status === 'shipped' ? 'bg-sky-100 text-sky-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{getActionButtons(order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
