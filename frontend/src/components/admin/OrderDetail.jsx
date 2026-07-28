import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiPackage, FiTruck, FiClock, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [actualWeight, setActualWeight] = useState(250);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pelunasanLoading, setPelunasanLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data.data);
      setStatus(res.data.data.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdateLoading(true);
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success('Status pesanan berhasil diupdate!');
      await fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengupdate status pesanan');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    if (!window.confirm("Pastikan kustomer sudah menerima barang. Lanjutkan?")) return;
    try {
      setUpdateLoading(true);
      await api.put(`/admin/orders/${id}/complete-pickup`);
      toast.success('Pickup selesai! Status menjadi DELIVERED.');
      await fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyelesaikan pickup');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRequestPickup = async () => {
    if (!window.confirm(`Request pickup untuk kurir ${order.shippingCourier}?`)) return;
    try {
      setPickupLoading(true);
      await api.put(`/admin/orders/${id}/pickup`, { actualWeight });
      toast.success('Pickup kurir berhasil diminta!');
      await fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal request pickup kurir');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleRequestPelunasan = async () => {
    if (!window.confirm("Buat dan kirim tagihan pelunasan (50% sisa) via WhatsApp sekarang?")) return;
    try {
      setPelunasanLoading(true);
      const res = await api.post(`/orders/custom-sablon/${id}/pelunasan`);
      toast.success(res.data.message || 'Tagihan pelunasan berhasil dikirim!');
      await fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim tagihan pelunasan');
    } finally {
      setPelunasanLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center">
        <p className="font-medium text-lg mb-4">{error || 'Pesanan tidak ditemukan'}</p>
        <button onClick={() => navigate('/admin/orders')} className="text-blue-600 hover:underline flex items-center gap-2">
          <FiArrowLeft /> Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
    REFUND_REQUESTED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-teal-100 text-teal-800',
    RETURNED: 'bg-rose-100 text-rose-800',
    READY_TO_SHIP: 'bg-cyan-100 text-cyan-800'
  };

  let deliveryAddress = {};
  try {
    deliveryAddress = typeof order.deliveryAddress === 'string' 
      ? JSON.parse(order.deliveryAddress) 
      : order.deliveryAddress;
  } catch(e) {}

  const isSablon = order.orderNumber?.startsWith('SAB-');
  const itemsSubtotal = order.items?.reduce((sum, item) => sum + (parseInt(item.unitPrice || item.price || 0) * parseInt(item.quantity || 1)), 0) || 0;
  const trueSubtotal = isSablon ? parseInt(order.totalAmount || 0) : itemsSubtotal;
  
  const isDpPayment = order.payment && order.payment.paymentType === 'DP';
  const totalDibayarDP = isDpPayment ? parseInt(order.payment.amount || 0) : 0;
  const sisaTagihan = trueSubtotal - totalDibayarDP;

  const isOverdue = order.designRequests?.some(dr => {
    if (!dr.deadline) return false;
    const deadlineDate = new Date(dr.deadline);
    const today = new Date();
    deadlineDate.setHours(23, 59, 59, 999); 
    return today > deadlineDate && !['SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'].includes(order.status);
  });

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/admin/orders')} className="text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1 text-sm font-medium transition-colors">
              <FiArrowLeft /> Kembali
            </button>
            <button onClick={() => window.print()} className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 text-sm font-medium transition-colors">
              <FiFileText /> Cetak Struk
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            Pesanan #{order.orderNumber}
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status}
            </span>
            {order.deliveryType === 'PICKUP' && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                🏪 Ambil di Toko
              </span>
            )}
            {order.deliveryType === 'SHIPPING' && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                🚚 Kirim via Kurir
              </span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <FiClock /> Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
          {order.trackingNumber && (
            <p className="text-blue-600 font-medium text-sm mt-2 flex items-center gap-2 bg-blue-50 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
              <FiTruck /> No. Resi ({order.shippingCourier || 'Kurir'}): {order.trackingNumber}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            <option value={order.status}>{order.status} (Saat Ini)</option>
            {[
              { value: 'PENDING', label: 'PENDING' },
              { value: 'CONFIRMED', label: 'CONFIRMED (Manual Pay)' },
              { value: 'PAID_WAITING_APPROVAL', label: 'PAID_WAITING_APPROVAL (Xendit)' },
              { value: 'PROCESSING', label: 'PROCESSING (Retail)' },
              { value: 'IN_PRODUCTION', label: 'IN_PRODUCTION (Sablon)' },
              { value: 'WAITING_FINAL_PAYMENT', label: 'WAITING_FINAL_PAYMENT (Sablon)' },
              { value: 'READY_TO_SHIP', label: 'READY_TO_SHIP (Siap Diambil/Kirim)' },
              { value: 'SHIPPED', label: 'SHIPPED' },
              { value: 'DELIVERED', label: 'DELIVERED' },
              { value: 'COMPLETED', label: 'COMPLETED' },
              { value: 'CANCELLED', label: 'CANCELLED' },
              { value: 'ON_HOLD', label: 'ON_HOLD' },
              { value: 'REFUND_REQUESTED', label: 'REFUND_REQUESTED' },
              { value: 'REFUNDED', label: 'REFUNDED' },
              { value: 'RETURNED', label: 'RETURNED' },
            ].map(opt => {
              const allowed = {
                PENDING: ['PAID_WAITING_APPROVAL', 'CONFIRMED', 'CANCELLED'],
                CONFIRMED: ['PROCESSING', 'CANCELLED', 'REFUND_REQUESTED'],
                PAID_WAITING_APPROVAL: ['PROCESSING', 'IN_PRODUCTION', 'CANCELLED', 'REFUND_REQUESTED'],
                IN_PRODUCTION: isDpPayment ? ['WAITING_FINAL_PAYMENT', 'CANCELLED'] : ['READY_TO_SHIP', 'CANCELLED'],
                WAITING_FINAL_PAYMENT: ['READY_TO_SHIP', 'CANCELLED', 'ABANDONED', 'ON_HOLD'],
                PROCESSING: ['READY_TO_SHIP', 'READY_FOR_DELIVERY', 'FAILED', 'ON_HOLD'],
                READY_TO_SHIP: ['SHIPPED', 'DELIVERED', 'FAILED'],
                READY_FOR_DELIVERY: ['SHIPPED', 'DELIVERED', 'FAILED', 'ON_HOLD'],
                SHIPPED: ['DELIVERED', 'COMPLETED', 'FAILED', 'RETURNED'],
                DELIVERED: ['COMPLETED', 'RETURNED'],
                COMPLETED: [],
                CANCELLED: [],
                ABANDONED: [],
                FAILED: ['PROCESSING', 'CANCELLED'],
                ON_HOLD: ['PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED', 'CANCELLED', 'WAITING_FINAL_PAYMENT'],
                REFUND_REQUESTED: ['REFUNDED', 'CONFIRMED'],
                REFUNDED: [],
                RETURNED: []
              }[order.status] || [];

              if (allowed.includes(opt.value)) {
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              }
              return null;
            })}
          </select>
          <button 
            onClick={handleUpdateStatus}
            disabled={updateLoading || status === order.status}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {updateLoading ? 'Update...' : 'Update Status'}
          </button>
          
          {order.orderNumber?.startsWith('SAB-') && order.status === 'WAITING_FINAL_PAYMENT' && order.paymentOption === 'DP_50' && (
              <button
                onClick={handleRequestPelunasan}
                disabled={pelunasanLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-4 flex items-center gap-2"
              >
                <FiCreditCard /> {pelunasanLoading ? 'Memproses...' : 'Kirim Tagihan Pelunasan'}
              </button>
            )}

          {order.deliveryType === 'PICKUP' && order.status === 'READY_TO_SHIP' && (
            <button
              onClick={handleCompletePickup}
              disabled={updateLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FiCheckCircle /> Serahkan Barang
            </button>
          )}

          {order.deliveryType === 'SHIPPING' && order.status === 'READY_TO_SHIP' && !order.trackingNumber && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
              <input 
                type="number" 
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                placeholder="Berat (gram)"
                className="w-24 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              />
              <span className="text-xs text-gray-500">gram</span>
              <button
                onClick={handleRequestPickup}
                disabled={pickupLoading || !order.shippingCourier}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiTruck /> {pickupLoading ? 'Requesting...' : 'Request Pickup Kurir'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overdue Banner */}
      {isOverdue && (
        <div className="bg-red-50 text-red-900 p-6 rounded-2xl border border-red-200 mt-6 shadow-sm animate-pulse">
          <div className="flex items-start gap-4">
            <div className="text-red-500 mt-1">
              <FiAlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">PESANAN TERLAMBAT (OVERDUE)</h3>
              <p className="text-sm font-medium">
                Pesanan ini sudah melewati batas waktu deadline yang ditentukan! Segera proses pesanan ini atau hubungi kustomer untuk konfirmasi keterlambatan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Banner */}
      {order.status === 'REFUND_REQUESTED' && (
        <div className="bg-red-50 text-red-900 p-6 rounded-2xl border border-red-200 mt-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-red-500 mt-1">
              <FiAlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Permintaan Refund / Pembatalan</h3>
              <p className="text-sm mb-4">
                Kustomer telah mengajukan pembatalan pesanan ini. Alasan: <strong className="bg-red-100 px-2 py-0.5 rounded">{order.cancelReason || 'Tidak ada alasan.'}</strong>
              </p>
              
              {/* Parse and display JSON bank details if exists */}
              {(() => {
                let parsedBank = null;
                if (typeof order.refundDetails === 'string') {
                  try {
                    parsedBank = JSON.parse(order.refundDetails);
                  } catch (e) { console.error('Failed parsing refundDetails', e); }
                } else if (order.refundDetails && typeof order.refundDetails === 'object') {
                  parsedBank = order.refundDetails;
                }

                if (parsedBank) {
                  return (
                    <div className="bg-white p-4 rounded-xl border border-red-100 mb-5 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Detail Rekening Tujuan Transfer:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Bank / E-Wallet</p>
                          <p className="font-semibold text-gray-900">{parsedBank.bankName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Nomor Rekening</p>
                          <div className="flex items-center gap-2">
                            <p className="font-bold font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded select-all">{parsedBank.accountNumber}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Atas Nama</p>
                          <p className="font-semibold text-gray-900">{parsedBank.accountName}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (window.confirm('Setujui refund dan batalkan pesanan ini?')) {
                      setStatus('REFUNDED');
                      await api.put(`/admin/orders/${id}/status`, { status: 'REFUNDED' });
                      fetchOrderDetail();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Setujui Refund
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Tolak permintaan refund dan kembalikan pesanan ke status CONFIRMED?')) {
                      setStatus('CONFIRMED');
                      await api.put(`/admin/orders/${id}/status`, { status: 'CONFIRMED' });
                      fetchOrderDetail();
                    }
                  }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Tolak Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <FiPackage className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Daftar Produk</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Retail Items */}
              {order.items?.map((item) => {
                const itemName = item.product?.productName || 'Produk Dihapus';
                const itemImg = item.variant?.imageUrl || item.product?.imageUrl;
                
                return (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {itemImg ? (
                      <img src={itemImg} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="text-gray-400 text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{itemName}</h4>
                      {item.variant && <p className="text-sm text-gray-500 mt-0.5">Varian: {item.variant.variantName}</p>}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-medium text-gray-600">
                        Rp {item.unitPrice?.toLocaleString('id-ID')} <span className="text-gray-400 font-normal">x {item.quantity}</span>
                      </p>
                      <p className="font-bold text-gray-800">Rp {item.subtotal?.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              )})}

              {/* Sablon Custom Items */}
              {order.designRequests?.map((sablonData) => {
                const itemName = `Custom Sablon - ${sablonData.designTitle}`;
                const itemImg = sablonData.mockupPreviewUrl || sablonData.designFileUrl;
                
                let calculatedQty = sablonData.quantity || 1;
                if (sablonData.sizeBreakdown) {
                  try {
                    const parsed = typeof sablonData.sizeBreakdown === 'object' ? sablonData.sizeBreakdown : JSON.parse(sablonData.sizeBreakdown);
                    const sum = Object.values(parsed).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                    if (sum > 0) calculatedQty = sum;
                  } catch(e) {
                    if (typeof sablonData.sizeBreakdown === 'string') {
                      const matches = sablonData.sizeBreakdown.match(/\d+/g);
                      if (matches) {
                        const sum = matches.reduce((acc, val) => acc + parseInt(val), 0);
                        if (sum > 0) calculatedQty = sum;
                      }
                    }
                  }
                }

                return (
                <div key={sablonData.id} className="flex gap-4 p-4 rounded-xl border border-blue-50 bg-blue-50/10 hover:bg-blue-50/30 transition-colors">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-blue-100">
                    {itemImg ? (
                      <img src={itemImg} alt="Sablon Design" className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="text-gray-400 text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{itemName}</h4>
                      <p className="text-xs text-blue-600 mt-1">Design Request ID: {sablonData.id.slice(0, 8)}</p>
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5 bg-white p-2 rounded-md border border-blue-100">
                        {sablonData.printTechnique && <p><span className="font-medium text-gray-600">Teknik:</span> {sablonData.printTechnique}</p>}
                        {sablonData.printPosition && <p><span className="font-medium text-gray-600">Posisi:</span> {sablonData.printPosition}</p>}
                        {sablonData.printSize && <p><span className="font-medium text-gray-600">Ukuran Sablon:</span> {sablonData.printSize}</p>}
                        {sablonData.colorPreferences && <p><span className="font-medium text-gray-600">Warna Produk:</span> {sablonData.colorPreferences}</p>}
                        {sablonData.sizeBreakdown && (
                          <p><span className="font-medium text-gray-600">Ukuran Baju/Tas:</span> {
                            (() => {
                              if (typeof sablonData.sizeBreakdown === 'object') {
                                return Object.entries(sablonData.sizeBreakdown).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                              }
                              try {
                                const parsed = JSON.parse(sablonData.sizeBreakdown);
                                return Object.entries(parsed).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                              } catch (e) {
                                return String(sablonData.sizeBreakdown);
                              }
                            })()
                          }</p>
                        )}
                        {sablonData.estimatedPrice && (
                           <p className="mt-1"><span className="font-medium text-blue-600">Estimasi Harga Admin:</span> Rp {parseInt(sablonData.estimatedPrice).toLocaleString('id-ID')} / pcs</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-medium text-gray-600">
                         {calculatedQty} pcs
                      </p>
                      <p className="font-bold text-gray-800">
                        {sablonData.status === 'APPROVED' ? 'Disetujui' : 
                         sablonData.status === 'REJECTED' ? 'Ditolak' : 
                         sablonData.status === 'SUBMITTED' ? 'Menunggu Review' : 
                         sablonData.status}
                      </p>
                    </div>
                  </div>
                </div>
              )})}
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Subtotal Produk</span>
                <span>Rp {trueSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Ongkos Kirim ({order.shippingCourier || 'Manual/Pickup'})</span>
                <span>Rp {parseInt(order.shippingCost || 0).toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold text-gray-800 pt-3 border-t border-gray-200">
                <span className="flex items-center gap-2">
                  Total Tagihan
                  {isDpPayment && (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-md border border-amber-200">PEMBAYARAN: DP 50%</span>
                  )}
                  {order.payment && order.payment.paymentType === 'FULL' && order.designRequests?.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md border border-blue-200">PELUNASAN SABLON</span>
                  )}
                </span>
                <span className="text-blue-700">Rp {(trueSubtotal + parseInt(order.shippingCost || 0)).toLocaleString('id-ID')}</span>
              </div>
              
              {isDpPayment && (
                <div className="mt-2 pt-3 border-t border-gray-200 space-y-2 bg-white p-3 rounded-lg border">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Telah Dibayar (DP)</span>
                    <span className="text-green-600 font-bold">- Rp {totalDibayarDP.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-800 pt-1 border-t border-gray-100">
                    <span>Sisa Tagihan Berikutnya</span>
                    <span className="text-red-600">Rp {(sisaTagihan + parseInt(order.shippingCost || 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Shipping Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <FiMapPin className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Alamat Pengiriman</h3>
            </div>
            <div className="p-5">
              {deliveryAddress ? (
                <div className="space-y-3 text-sm">
                  <p className="font-bold text-gray-800 text-base">{deliveryAddress.fullName}</p>
                  <p className="text-gray-600 break-words">{deliveryAddress.addressLine1}</p>
                  <p className="text-gray-600">{deliveryAddress.city}, {deliveryAddress.postalCode}</p>
                  <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
                    <p className="text-gray-600"><span className="text-gray-400">Email:</span> {deliveryAddress.email}</p>
                    <p className="text-gray-600"><span className="text-gray-400">Telepon:</span> {deliveryAddress.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Informasi alamat tidak tersedia.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <FiCreditCard className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Informasi Pembayaran</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Metode</span>
                <span className="font-bold text-gray-800">{order.paymentMethod || '-'}</span>
              </div>
              
              {/* Payment Proof rendering if exists */}
              {order.payment && order.payment.proofUrl ? (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-500 block mb-2">Bukti Transfer:</span>
                  <a href={order.payment.proofUrl} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-lg border border-gray-200 overflow-hidden hover:border-blue-500 transition-colors">
                    <img src={order.payment.proofUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                  </a>
                </div>
              ) : order.payment ? (
                order.paymentMethod === 'XENDIT' && order.payment.status === 'COMPLETED' ? (
                  <div className="pt-3 border-t border-gray-100 text-green-600 flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-medium">
                      <FiCheckCircle /> Lunas terverifikasi otomatis
                    </div>
                    {order.payment.xenditId && (
                      <span className="text-xs text-gray-400">Ref: {order.payment.xenditId}</span>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100 text-yellow-600 flex items-center gap-2">
                    <FiClock /> Belum ada bukti pembayaran
                  </div>
                )
              ) : (
                <div className="pt-3 border-t border-gray-100 text-gray-500">
                  Data pembayaran tidak ditemukan.
                </div>
              )}
            </div>
          </div>
          
          {order.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <FiFileText className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Catatan Pelanggan</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Printable Invoice Section */}
    <div className="hidden print:block text-black bg-white p-8 max-w-3xl mx-auto text-sm font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Arianation</h1>
        <p className="text-xs text-gray-600">JL. RAYA KASEMBON, RT 03, RW 01, DSN. SANGGRAHAN, KEC. KASEMBON, KAB. MALANG</p>
        <p className="text-xs text-gray-600">Phone: 085649697970 | Email: arianationid@gmail.com</p>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-bold text-lg mb-1">INVOICE</h2>
          <p className="text-sm"><strong>Order ID:</strong> {order.orderNumber}</p>
          <p className="text-sm"><strong>Tanggal:</strong> {new Date(order.createdAt).toLocaleString('id-ID')}</p>
          <p className="text-sm"><strong>Pembayaran:</strong> {order.paymentMethod || 'Transfer'}</p>
        </div>
        <div className="text-right max-w-xs">
          <p className="font-bold">Kepada:</p>
          <p className="text-sm font-semibold uppercase">{deliveryAddress?.firstName || deliveryAddress?.fullName || 'Kustomer'} {deliveryAddress?.lastName || ''}</p>
          <p className="text-sm">{deliveryAddress?.address || deliveryAddress?.addressLine1}</p>
          <p className="text-sm">{deliveryAddress?.city}, {deliveryAddress?.postalCode}</p>
          <p className="text-sm">{deliveryAddress?.phone}</p>
        </div>
      </div>

      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="py-2 text-left w-1/2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Harga</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
            {/* Print Retail Items */}
            {order.items?.map((item, idx) => {
              return (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 flex-shrink-0 mt-1">
                      <img src={item.variantImage || item.productImage || item.product?.imageUrl || item.variant?.imageUrl || 'https://via.placeholder.com/48'} className="w-full h-full object-cover" alt="product" />
                    </div>
                    <div>
                      <p className="font-semibold uppercase text-xs">{item.productName || item.product?.productName || 'Produk Dihapus'}</p>
                      <p className="text-xs text-gray-600 uppercase">{item.variantName || item.variant?.variantName || ''} {item.color ? `| ${item.color}` : ''}</p>
                    </div>
                  </td>
                  <td className="py-2 text-center text-sm align-top mt-1">{item.quantity}</td>
                  <td className="py-2 text-right text-sm align-top mt-1">Rp {parseInt(item.unitPrice || item.price || 0).toLocaleString('id-ID')}</td>
                  <td className="py-2 text-right text-sm align-top mt-1">Rp {(parseInt(item.unitPrice || item.price || 0) * parseInt(item.quantity || 1)).toLocaleString('id-ID')}</td>
                </tr>
              );
            })}
          {/* Print Sablon Items */}
          {order.designRequests?.map((sablonData, idx) => {
            let calculatedQty = sablonData.quantity || 1;
            if (sablonData.sizeBreakdown) {
              try {
                const parsed = typeof sablonData.sizeBreakdown === 'object' ? sablonData.sizeBreakdown : JSON.parse(sablonData.sizeBreakdown);
                const sum = Object.values(parsed).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                if (sum > 0) calculatedQty = sum;
              } catch(e) {
                if (typeof sablonData.sizeBreakdown === 'string') {
                  const matches = sablonData.sizeBreakdown.match(/\d+/g);
                  if (matches) {
                    const sum = matches.reduce((acc, val) => acc + parseInt(val), 0);
                    if (sum > 0) calculatedQty = sum;
                  }
                }
              }
            }

            return (
              <tr key={`sablon-${idx}`} className="border-b border-gray-200 bg-gray-50/50">
                <td className="py-2 flex items-start gap-3">
                  <div className="w-12 h-12 bg-white border border-gray-300 flex-shrink-0 mt-1">
                    <img src={sablonData.mockupPreviewUrl || sablonData.designFileUrl || 'https://via.placeholder.com/48'} className="w-full h-full object-cover" alt="product" />
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-xs">Custom Sablon - {sablonData.designTitle}</p>
                    <p className="text-xs text-gray-600 uppercase">
                      {sablonData.status === 'APPROVED' ? 'Disetujui' : 
                       sablonData.status === 'REJECTED' ? 'Ditolak' : 
                       sablonData.status === 'SUBMITTED' ? 'Menunggu Review' : 
                       sablonData.status}
                    </p>
                    
                    <div className="mt-1 text-[10px] text-gray-500 leading-tight">
                      {sablonData.printTechnique && <div>Teknik: {sablonData.printTechnique}</div>}
                      {sablonData.printPosition && <div>Posisi: {sablonData.printPosition}</div>}
                      {sablonData.sizeBreakdown && (
                        <div>Size: {
                          (() => {
                            if (typeof sablonData.sizeBreakdown === 'object') {
                              return Object.entries(sablonData.sizeBreakdown).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                            }
                            try {
                              const parsed = JSON.parse(sablonData.sizeBreakdown);
                              return Object.entries(parsed).filter(([_,v]) => parseInt(v) > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
                            } catch (e) {
                              return String(sablonData.sizeBreakdown);
                            }
                          })()
                        }</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 text-center text-sm align-top mt-1">{calculatedQty}</td>
                <td className="py-2 text-right text-sm align-top mt-1">-</td>
                <td className="py-2 text-right text-sm align-top mt-1">-</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm">
            <span>Subtotal Produk:</span>
            <span>Rp {trueSubtotal.toLocaleString('id-ID')}</span>
          </div>
          {isDpPayment && (
            <div className="flex justify-between py-1 text-sm text-gray-600">
              <span>Telah Dibayar (DP):</span>
              <span>- Rp {totalDibayarDP.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between py-1 text-sm">
            <span>Ongkos Kirim ({order.shippingCourier || '-'}):</span>
            <span>Rp {parseInt(order.shippingCost || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between py-2 mt-2 font-bold text-lg border-t border-black">
            <span>Total Tagihan Saat Ini:</span>
            <span>Rp {(isDpPayment ? sisaTagihan + parseInt(order.shippingCost || 0) : trueSubtotal + parseInt(order.shippingCost || 0)).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 pt-4 border-t border-dashed border-gray-400">
        <p className="text-xs font-bold uppercase tracking-widest">Terima Kasih Telah Berbelanja di Arianation</p>
        <p className="text-xs text-gray-500 mt-1">Struk ini adalah bukti pembayaran yang sah.</p>
      </div>
    </div>
    </>
  );
}
