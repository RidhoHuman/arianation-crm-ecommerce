import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../services/api';

export default function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data?.data || null);
      } catch (err) {
        console.error('Failed to fetch invoice data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && !loading) {
      // Trigger print automatically after data is loaded and rendered
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order, loading]);

  if (loading) {
    return <div className="p-10 text-center font-sans">Loading Invoice...</div>;
  }

  if (!order) {
    return <div className="p-10 text-center font-sans text-red-500">Invoice Not Found.</div>;
  }

  const { items, user, deliveryAddress } = order;
  
  let parsedAddress = '';
  if (typeof deliveryAddress === 'string') {
    try {
      const addrObj = JSON.parse(deliveryAddress);
      parsedAddress = [
        addrObj.addressLine1,
        addrObj.city,
        addrObj.postalCode,
        addrObj.phone
      ].filter(Boolean).join(', ');
    } catch (e) {
      parsedAddress = deliveryAddress;
    }
  } else if (deliveryAddress && typeof deliveryAddress === 'object') {
    parsedAddress = [
      deliveryAddress.addressLine1,
      deliveryAddress.city,
      deliveryAddress.postalCode,
      deliveryAddress.phone
    ].filter(Boolean).join(', ');
  }

  return (
    <div className="bg-white text-black font-sans min-h-screen p-8 max-w-4xl mx-auto">
      {/* Hide on screen, print only styles */}
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Buttons (Screen Only) */}
      <div className="no-print mb-8 flex justify-end gap-4 border-b pb-4">
        <button onClick={() => window.close()} className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50">Tutup Tab</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">Cetak PDF</button>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-widest">INVOICE</h1>
          <p className="text-sm font-semibold mt-2 text-gray-600">ARIANATION STORE</p>
          <p className="text-xs text-gray-500">Jl. Contoh No. 123, Bandung, Indonesia</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">No. Pesanan: {order.orderNumber || order.id.slice(0, 8)}</p>
          <p className="text-sm">Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm mt-2 font-semibold uppercase">Status: {order.status}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Ditagih Kepada:</h2>
          <p className="font-semibold">{user?.fullName || order.guestEmail?.split('@')[0] || 'Guest'}</p>
          <p className="text-sm">{user?.email || order.guestEmail}</p>
          {user?.phone && <p className="text-sm">{user.phone}</p>}
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Dikirim Ke:</h2>
          <p className="text-sm whitespace-pre-wrap">{parsedAddress || 'Alamat tidak tersedia'}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs">Produk</th>
            <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-center">Qty</th>
            <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-right">Harga Satuan</th>
            <th className="py-3 px-2 font-bold uppercase tracking-wider text-xs text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items?.length > 0 ? items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-4 px-2">
                <p className="font-semibold text-sm">{item.product?.productName || 'Produk'}</p>
              </td>
              <td className="py-4 px-2 text-center text-sm">{item.quantity}</td>
              <td className="py-4 px-2 text-right text-sm">Rp {Number(item.unitPrice).toLocaleString('id-ID')}</td>
              <td className="py-4 px-2 text-right text-sm font-semibold">Rp {Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-500 text-sm">Tidak ada produk ditemukan.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Total Calculation */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-black">
            <span className="font-bold">TOTAL</span>
            <span className="font-bold text-xl">Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</span>
          </div>
          <p className="text-xs text-right mt-2 text-gray-500 uppercase tracking-wider">
            Metode: {order.paymentMethod || 'Manual'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t text-sm text-gray-500">
        <p className="font-semibold text-black">Terima kasih atas pesanan Anda!</p>
        <p className="mt-1 text-xs">Jika Anda memiliki pertanyaan tentang invoice ini, silakan hubungi support@arianation.com</p>
      </div>
    </div>
  );
}
