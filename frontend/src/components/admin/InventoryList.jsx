import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantityInputs, setQuantityInputs] = useState({});
  const [restockInputs, setRestockInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);

        const [inventoryRes, analyticsRes] = await Promise.all([
          api.get('/admin/inventory'),
          api.get('/admin/inventory/analytics'),
        ]);

        setInventory(inventoryRes.data.data || []);
        setAnalytics(analyticsRes.data.data || null);
      } catch (e) {
        setError(e?.response?.data?.message || 'Gagal memuat inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const refreshInventory = async () => {
    try {
      const response = await api.get('/admin/inventory');
      setInventory(response.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal menyegarkan inventory');
    }
  };

  const handleInputChange = (productId, value, type) => {
    if (type === 'stock') {
      setQuantityInputs((prev) => ({ ...prev, [productId]: value }));
    } else {
      setRestockInputs((prev) => ({ ...prev, [productId]: value }));
    }
  };

  const handleUpdateStock = async (productId) => {
    const quantity = parseInt(quantityInputs[productId] ?? '', 10);
    if (isNaN(quantity)) {
      setMessage('Masukkan angka stok yang valid');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: true }));
    setMessage(null);

    try {
      const response = await api.patch(`/admin/inventory/${productId}/stock`, { quantity });
      setMessage(response.data?.message || 'Stok berhasil diperbarui');
      await refreshInventory();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal memperbarui stok');
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRestock = async (productId) => {
    const quantity = parseInt(restockInputs[productId] ?? '', 10);
    if (isNaN(quantity)) {
      setMessage('Masukkan angka restock yang valid');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [productId]: true }));
    setMessage(null);

    try {
      const response = await api.post(`/admin/inventory/${productId}/restock`, { quantity });
      setMessage(response.data?.message || 'Produk berhasil di-restock');
      await refreshInventory();
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal melakukan restock');
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const summaryCards = analytics ? [
    { label: 'Total Stok', value: analytics.inventory?.totalStock ?? 0 },
    { label: 'Low Stock', value: analytics.inventory?.lowStockProducts ?? 0 },
    { label: 'PO Pending Qty', value: analytics.poOrders?.pendingQuantity ?? 0 },
    { label: 'Kategori', value: analytics.byCategory?.length ?? 0 },
  ] : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Inventory Management</h2>
          <p className="text-gray-600">Pantau stok produk, update jumlah, dan restock item penting dari dashboard admin.</p>
        </div>
        <button
          type="button"
          onClick={refreshInventory}
          className="inline-flex items-center justify-center rounded-full bg-aria-charcoal px-5 py-2 text-sm font-semibold text-white hover:bg-aria-maroon transition"
        >
          Refresh Data
        </button>
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

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-gray-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-gray-500">{card.label}</p>
              <p className="mt-4 text-3xl font-bold text-aria-charcoal">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center py-12">Memuat data inventory...</p>
      ) : inventory.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
          Tidak ada data inventory tersedia.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Ready Stock</th>
                <th className="px-4 py-3">PO Pending</th>
                <th className="px-4 py-3">Tipe Stok</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-t border-gray-200 bg-white">
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} className="mt-2 h-14 w-14 rounded-lg object-cover" />
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-gray-600">{item.category || '—'}</td>
                  <td className="px-4 py-4 align-top text-sm text-gray-900">
                    <span className={item.lowStock ? 'font-semibold text-aria-maroon' : 'font-semibold text-gray-900'}>
                      {item.readyStock}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-gray-600">
                    {item.poQuantity ?? 0} item ({item.poCount ?? 0} PO)
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-gray-600">{item.stockType || 'N/A'}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-3">
                      <div className="space-y-2 rounded-3xl border border-gray-200 bg-aria-cream p-3">
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">Update</label>
                        <input
                          type="number"
                          value={quantityInputs[item.id] ?? item.readyStock}
                          onChange={(e) => handleInputChange(item.id, e.target.value, 'stock')}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(item.id)}
                          disabled={actionLoading[item.id]}
                          className="w-full rounded-full bg-aria-charcoal px-3 py-2 text-sm font-semibold text-white hover:bg-aria-maroon transition disabled:opacity-60"
                        >
                          {actionLoading[item.id] ? 'Memproses...' : 'Update'}
                        </button>
                      </div>
                      <div className="space-y-2 rounded-3xl border border-gray-200 bg-white p-3">
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">Restock</label>
                        <input
                          type="number"
                          value={restockInputs[item.id] ?? ''}
                          onChange={(e) => handleInputChange(item.id, e.target.value, 'restock')}
                          placeholder="Qty"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRestock(item.id)}
                          disabled={actionLoading[item.id]}
                          className="w-full rounded-full bg-aria-maroon px-3 py-2 text-sm font-semibold text-white hover:bg-black transition disabled:opacity-60"
                        >
                          {actionLoading[item.id] ? 'Memproses...' : 'Restock'}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
