import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiPackage, FiTruck, FiClock, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [status, setStatus] = useState('');

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
    CANCELLED: 'bg-red-100 text-red-800',
  };

  let deliveryAddress = {};
  try {
    deliveryAddress = typeof order.deliveryAddress === 'string' 
      ? JSON.parse(order.deliveryAddress) 
      : order.deliveryAddress;
  } catch(e) {}

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <button onClick={() => navigate('/admin/orders')} className="text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1 text-sm font-medium transition-colors">
            <FiArrowLeft /> Kembali
          </button>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            Pesanan #{order.orderNumber}
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status}
            </span>
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <FiClock /> Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button 
            onClick={handleUpdateStatus}
            disabled={updateLoading || status === order.status}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {updateLoading ? 'Update...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <FiPackage className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Daftar Produk</h3>
            </div>
            <div className="p-5 space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="text-gray-400 text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{item.product?.productName || 'Produk Dihapus'}</h4>
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
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                <span>Total Pesanan</span>
                <span>Rp {order.totalAmount?.toLocaleString('id-ID')}</span>
              </div>
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
                <div className="pt-3 border-t border-gray-100 text-yellow-600 flex items-center gap-2">
                  <FiClock /> Belum ada bukti pembayaran
                </div>
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
  );
}
