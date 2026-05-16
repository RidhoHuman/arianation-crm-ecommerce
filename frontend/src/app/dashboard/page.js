'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED'];

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusStyles(status) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PROCESSING':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'READY_FOR_DELIVERY':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'SHIPPED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'FAILED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const selectedOrderProgress = useMemo(() => {
    if (!selectedOrder?.status) return 0;
    const index = ORDER_STEPS.indexOf(selectedOrder.status);
    return index >= 0 ? ((index + 1) / ORDER_STEPS.length) * 100 : 0;
  }, [selectedOrder]);

  const fetchMe = async () => {
    const response = await fetch('http://localhost:3001/api/auth/me', {
      credentials: 'include',
      headers: authHeaders(),
    });

    if (!response.ok) throw new Error('Sesi login tidak valid. Silakan login ulang.');

    const data = await response.json();
    return data.data;
  };

  const fetchOrders = async () => {
    const response = await fetch('http://localhost:3001/api/orders?limit=20&page=1', {
      credentials: 'include',
      headers: authHeaders(),
    });

    if (!response.ok) throw new Error('Gagal memuat daftar order.');

    const data = await response.json();
    return data.data || [];
  };

  const fetchOrderDetail = async (orderId) => {
    const [detailRes, timelineRes] = await Promise.all([
      fetch(`http://localhost:3001/api/orders/${orderId}`, {
        credentials: 'include',
        headers: authHeaders(),
      }),
      fetch(`http://localhost:3001/api/orders/${orderId}/timeline`, {
        credentials: 'include',
        headers: authHeaders(),
      }),
    ]);

    if (!detailRes.ok) throw new Error('Gagal memuat detail order.');
    if (!timelineRes.ok) throw new Error('Gagal memuat timeline pengiriman.');

    const detailData = await detailRes.json();
    const timelineData = await timelineRes.json();

    setSelectedOrder(detailData.data);
    setTimeline(timelineData.data);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const me = await fetchMe();
      if (me.role !== 'CUSTOMER') {
        router.replace('/login');
        return;
      }

      setUser(me);

      const orderList = await fetchOrders();
      setOrders(orderList);

      if (orderList.length > 0) {
        await fetchOrderDetail(orderList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat dashboard.');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectOrder = async (orderId) => {
    try {
      setDetailLoading(true);
      await fetchOrderDetail(orderId);
    } catch (err) {
      setError(err.message || 'Gagal memuat order.');
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center px-4'>
        <div className='text-center space-y-3'>
          <div className='w-14 h-14 rounded-full border-4 border-gray-200 border-t-black animate-spin mx-auto' />
          <p className='text-sm tracking-wide uppercase text-gray-500'>Memuat dashboard pelanggan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50'>
      <section className='max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-12'>
        <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8'>
          <div>
            <p className='text-xs font-semibold tracking-[0.3em] uppercase text-gray-500'>Customer Dashboard</p>
            <h1 className='text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2'>Tracking Pesanan & Pengiriman</h1>
            <p className='text-gray-600 mt-3 max-w-2xl'>
              Halo {user?.fullName || 'Pelanggan'}, Anda dapat melihat status order, riwayat proses, dan perkembangan pengiriman barang di sini.
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:gap-4'>
            <div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>Total Order</p>
              <p className='text-2xl font-black text-gray-900 mt-1'>{orders.length}</p>
            </div>
            <div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
              <p className='text-xs uppercase tracking-wide text-gray-500'>Status Aktif</p>
              <p className='text-2xl font-black text-gray-900 mt-1'>{selectedOrder?.status || '-'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6'>
          <aside className='rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
            <div className='p-5 border-b border-gray-200 bg-gray-50/80'>
              <h2 className='text-lg font-bold text-gray-900'>Daftar Order</h2>
              <p className='text-sm text-gray-600 mt-1'>Pilih order untuk melihat detail tracking.</p>
            </div>

            <div className='divide-y divide-gray-100 max-h-[760px] overflow-y-auto'>
              {orders.length === 0 ? (
                <div className='p-6 text-center text-gray-500'>
                  Belum ada order yang tercatat.
                </div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={`w-full text-left p-5 transition ${selectedOrder?.id === order.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-bold text-gray-900'>{order.orderNumber}</p>
                        <p className='text-xs text-gray-500 mt-1'>{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide ${getStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className='mt-3 flex items-center justify-between text-sm text-gray-600'>
                      <span>{order.items?.length || 0} item</span>
                      <span className='font-semibold text-gray-900'>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className='space-y-6'>
            <div className='rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-[0.25em] text-gray-500'>Detail Order Terpilih</p>
                  <h2 className='text-2xl font-black text-gray-900 mt-2'>{selectedOrder?.orderNumber || 'Pilih order'}</h2>
                  <p className='text-gray-600 mt-2'>
                    {selectedOrder?.deliveryAddress || 'Alamat pengiriman belum tersedia.'}
                  </p>
                </div>
                <div className='min-w-[220px]'>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${getStatusStyles(selectedOrder?.status)}`}>
                    {selectedOrder?.status || 'NO ORDER'}
                  </div>
                  <div className='mt-3 h-3 rounded-full bg-gray-100 overflow-hidden'>
                    <div className='h-full rounded-full bg-gradient-to-r from-black to-blue-600 transition-all' style={{ width: `${selectedOrderProgress}%` }} />
                  </div>
                  <p className='text-xs text-gray-500 mt-2'>Progress pengiriman internal</p>
                </div>
              </div>

              {selectedOrder && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-6'>
                  <div className='rounded-2xl bg-gray-50 p-4 border border-gray-200'>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Tanggal Order</p>
                    <p className='font-bold text-gray-900 mt-1'>{formatDate(selectedOrder.orderDate)}</p>
                  </div>
                  <div className='rounded-2xl bg-gray-50 p-4 border border-gray-200'>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Total</p>
                    <p className='font-bold text-gray-900 mt-1'>{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div className='rounded-2xl bg-gray-50 p-4 border border-gray-200'>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Kurir</p>
                    <p className='font-bold text-gray-900 mt-1'>{selectedOrder.tracking?.carrier || '-'}</p>
                  </div>
                  <div className='rounded-2xl bg-gray-50 p-4 border border-gray-200'>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>No. Resi</p>
                    <p className='font-bold text-gray-900 mt-1 break-all'>{selectedOrder.tracking?.trackingNumber || '-'}</p>
                  </div>
                </div>
              )}

              {detailLoading && (
                <p className='text-sm text-gray-500 mt-4'>Memuat detail order...</p>
              )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'>
              <section className='rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6'>
                <div className='flex items-center justify-between gap-3 mb-4'>
                  <div>
                    <h3 className='text-xl font-bold text-gray-900'>Timeline Pengiriman</h3>
                    <p className='text-sm text-gray-600 mt-1'>Perjalanan order dari diproses hingga diterima.</p>
                  </div>
                </div>

                {timeline?.timeline?.length ? (
                  <div className='space-y-4'>
                    {timeline.timeline.map((item, index) => (
                      <div key={`${item.type}-${index}`} className='relative pl-6'>
                        <div className='absolute left-0 top-1.5 h-3 w-3 rounded-full bg-black' />
                        {index !== timeline.timeline.length - 1 && (
                          <div className='absolute left-[5px] top-5 h-full w-px bg-gray-200' />
                        )}
                        <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                            <div>
                              <p className='font-bold text-gray-900'>
                                {item.type === 'STATUS_CHANGE' ? `Status: ${item.status}` : `Tracking: ${item.status}`}
                              </p>
                              <p className='text-sm text-gray-600 mt-1'>
                                {item.type === 'STATUS_CHANGE'
                                  ? item.details?.reason || 'Perubahan status order'
                                  : item.details?.notes || 'Update perjalanan barang'}
                              </p>
                            </div>
                            <span className='text-xs text-gray-500'>{formatDateTime(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500'>
                    Timeline akan muncul setelah order memiliki status atau update pengiriman.
                  </div>
                )}
              </section>

              <section className='rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6'>
                <div className='flex items-center justify-between gap-3 mb-4'>
                  <div>
                    <h3 className='text-xl font-bold text-gray-900'>Informasi Tracking</h3>
                    <p className='text-sm text-gray-600 mt-1'>Data pengiriman yang dapat dilihat pelanggan.</p>
                  </div>
                </div>

                {selectedOrder?.tracking ? (
                  <div className='space-y-3'>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Status Tracking</p>
                      <p className='font-bold text-gray-900 mt-1'>{selectedOrder.tracking.status}</p>
                    </div>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Kurir</p>
                      <p className='font-bold text-gray-900 mt-1'>{selectedOrder.tracking.carrier || '-'}</p>
                    </div>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Nomor Resi</p>
                      <p className='font-bold text-gray-900 mt-1 break-all'>{selectedOrder.tracking.trackingNumber || '-'}</p>
                    </div>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Lokasi Terakhir</p>
                      <p className='font-bold text-gray-900 mt-1'>{selectedOrder.tracking.currentLocation || '-'}</p>
                    </div>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Estimasi Tiba</p>
                      <p className='font-bold text-gray-900 mt-1'>
                        {selectedOrder.tracking.estimatedDeliveryDate ? formatDate(selectedOrder.tracking.estimatedDeliveryDate) : '-'}
                      </p>
                    </div>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                      <p className='text-xs uppercase tracking-wide text-gray-500'>Catatan</p>
                      <p className='text-sm text-gray-700 mt-1'>{selectedOrder.tracking.notes || 'Tidak ada catatan tambahan.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500'>
                    Tracking belum tersedia untuk order ini.
                  </div>
                )}
              </section>
            </div>

            <section className='rounded-3xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6'>
              <div className='flex items-center justify-between gap-3 mb-4'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>Item Pesanan</h3>
                  <p className='text-sm text-gray-600 mt-1'>Rincian produk yang Anda pesan.</p>
                </div>
              </div>

              {selectedOrder?.items?.length ? (
                <div className='space-y-3'>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className='rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                      <div>
                        <p className='font-bold text-gray-900'>{item.product?.productName || 'Produk'}</p>
                        <p className='text-sm text-gray-600'>Qty {item.quantity} {item.variant?.variantName ? `• ${item.variant.variantName}` : ''}</p>
                      </div>
                      <p className='font-semibold text-gray-900'>{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500'>
                  Belum ada item pada order ini.
                </div>
              )}
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}
