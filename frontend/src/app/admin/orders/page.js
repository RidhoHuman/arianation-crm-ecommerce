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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailTab, setDetailTab] = useState('details');
  const [statusHistory, setStatusHistory] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    carrier: '',
    trackingNumber: '',
    currentLocation: '',
    estimatedDeliveryDate: '',
    status: 'PROCESSING',
    notes: '',
  });
  const [savingTracking, setSavingTracking] = useState(false);

  const fetchOrders = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(status && { status })
      });

      const response = await fetch(`http://localhost:3001/api/admin/orders?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const fetchOrderDetail = async (orderId) => {
    const res = await fetch(`http://localhost:3001/api/admin/orders/${orderId}`, {
      credentials: 'include',
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error('Failed to load order detail');

    const data = await res.json();
    setSelectedOrder(data.data);
    setShowDetail(true);
    setDetailTab('details');
    setTrackingInfo(data.data.tracking || null);
    setTrackingForm({
      carrier: data.data.tracking?.carrier || '',
      trackingNumber: data.data.tracking?.trackingNumber || '',
      currentLocation: data.data.tracking?.currentLocation || '',
      estimatedDeliveryDate: data.data.tracking?.estimatedDeliveryDate ? data.data.tracking.estimatedDeliveryDate.slice(0, 10) : '',
      status: data.data.tracking?.status || 'PROCESSING',
      notes: data.data.tracking?.notes || '',
    });
  };

  const fetchFulfillmentData = async (orderId) => {
    try {
      const [historyRes, timelineRes] = await Promise.all([
        fetch(`http://localhost:3001/api/admin/orders/${orderId}/status-history`, {
          credentials: 'include',
          headers: authHeaders(),
        }),
        fetch(`http://localhost:3001/api/admin/orders/${orderId}/timeline`, {
          credentials: 'include',
          headers: authHeaders(),
        }),
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setStatusHistory(Array.isArray(historyData.data) ? historyData.data : []);
      }

      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setTimeline(timelineData.data || null);
        setTrackingInfo(timelineData.data?.trackingInfo || null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOrderDetail = async (orderId) => {
    await fetchOrderDetail(orderId);
    await fetchFulfillmentData(orderId);
  };

  useEffect(() => {
    fetchOrders(1);
  }, [status]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchOrders(page);
      setShowDetail(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTrackingSave = async () => {
    if (!selectedOrder) return;

    try {
      setSavingTracking(true);
      const response = await fetch(`http://localhost:3001/api/admin/orders/${selectedOrder.id}/tracking`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          ...trackingForm,
          estimatedDeliveryDate: trackingForm.estimatedDeliveryDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update tracking');

      await loadOrderDetail(selectedOrder.id);
      setDetailTab('tracking');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTracking(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to cancel order');
      fetchOrders(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded ${
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
          status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
          status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800' :
          status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'totalAmount', label: 'Amount', render: (v) => formatCurrency(v) },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString('id-ID') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage customer orders</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchOrders}
        actions={[
          {
            label: 'View',
            color: '#3b82f6',
            onClick: async (row) => {
              await loadOrderDetail(row.id);
            }
          }
        ]}
      />

      {/* Detail Modal */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex gap-2 border-b border-gray-200 pb-3">
                {['details', 'status-history', 'tracking'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                      detailTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'details' ? 'Details' : tab === 'status-history' ? 'Status History' : 'Tracking'}
                  </button>
                ))}
              </div>

              {detailTab === 'details' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              )}

              {detailTab === 'status-history' && (
                <div className="space-y-3">
                  <p className="font-semibold">Status History</p>
                  {statusHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada riwayat status.</p>
                  ) : (
                    <div className="space-y-3">
                      {statusHistory.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{item.previousStatus} → {item.newStatus}</span>
                            <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.reason || 'Tanpa catatan alasan'}</p>
                          {item.notes && <p className="text-sm text-gray-500 mt-1">Catatan: {item.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'tracking' && (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">Tracking Management</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="px-3 py-2 border rounded" placeholder="Carrier" value={trackingForm.carrier} onChange={(e) => setTrackingForm((prev) => ({ ...prev, carrier: e.target.value }))} />
                      <input className="px-3 py-2 border rounded" placeholder="Tracking Number" value={trackingForm.trackingNumber} onChange={(e) => setTrackingForm((prev) => ({ ...prev, trackingNumber: e.target.value }))} />
                      <input className="px-3 py-2 border rounded" placeholder="Current Location" value={trackingForm.currentLocation} onChange={(e) => setTrackingForm((prev) => ({ ...prev, currentLocation: e.target.value }))} />
                      <input type="date" className="px-3 py-2 border rounded" value={trackingForm.estimatedDeliveryDate} onChange={(e) => setTrackingForm((prev) => ({ ...prev, estimatedDeliveryDate: e.target.value }))} />
                      <select className="px-3 py-2 border rounded" value={trackingForm.status} onChange={(e) => setTrackingForm((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="PACKED">PACKED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="IN_DELIVERY">IN_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                      <textarea className="px-3 py-2 border rounded md:col-span-2" rows={3} placeholder="Notes" value={trackingForm.notes} onChange={(e) => setTrackingForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleTrackingSave}
                        disabled={savingTracking}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingTracking ? 'Saving...' : 'Save Tracking'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Current Tracking</p>
                    {trackingInfo ? (
                      <div className="border border-gray-200 rounded-lg p-3 text-sm space-y-1">
                        <p><span className="font-semibold">Carrier:</span> {trackingInfo.carrier || '-'}</p>
                        <p><span className="font-semibold">Tracking #:</span> {trackingInfo.trackingNumber || '-'}</p>
                        <p><span className="font-semibold">Status:</span> {trackingInfo.status || '-'}</p>
                        <p><span className="font-semibold">Location:</span> {trackingInfo.currentLocation || '-'}</p>
                        <p><span className="font-semibold">ETA:</span> {trackingInfo.estimatedDeliveryDate ? new Date(trackingInfo.estimatedDeliveryDate).toLocaleDateString('id-ID') : '-'}</p>
                        <p><span className="font-semibold">Notes:</span> {trackingInfo.notes || '-'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada data tracking.</p>
                    )}
                  </div>

                  {timeline?.timeline?.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2">Timeline Ringkas</p>
                      <div className="space-y-2">
                        {timeline.timeline.map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{item.type === 'STATUS_CHANGE' ? 'Status Change' : 'Tracking Update'}</span>
                              <span className="text-gray-500">{new Date(item.timestamp).toLocaleString('id-ID')}</span>
                            </div>
                            <p className="mt-1 text-gray-700">{item.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="font-semibold mb-2">Items</p>
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.product?.productName || 'Product'} x {item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <p className="font-semibold mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedOrder.id, s)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition ${
                        selectedOrder.status === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              {selectedOrder.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleCancel(selectedOrder.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
