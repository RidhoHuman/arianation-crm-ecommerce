import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ShippingMethodSelector = ({ 
  deliveryType, 
  onChangeType, 
  shippingCost,
  shippingCourier,
  onCourierSelect,
  couriers,
  isSablonOrder = false 
}) => {
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [loadingInstructions, setLoadingInstructions] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const pickupSetting = res.data.data.pickup_instructions;
        if (pickupSetting) {
          setPickupInstructions(pickupSetting);
        }
      } catch (err) {
        console.error('Failed to fetch pickup instructions:', err);
      } finally {
        setLoadingInstructions(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Konten Tambahan Berdasarkan Tipe */}
      <div className="mt-2">
        {deliveryType === 'SHIPPING' && (
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pilih Ekspedisi</h4>
            {isSablonOrder ? (
               <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
                  Ongkos kirim untuk Custom Sablon akan dihitung secara manual oleh admin setelah desain dan berat asli produk diketahui. Pembayaran ongkos kirim akan ditagihkan pada tahap Pelunasan (setelah barang selesai diproduksi).
               </div>
            ) : (
              couriers && couriers.length > 0 ? (
                <div className="space-y-3">
                  {couriers.map((c) => (
                    <label key={`${c.courier_name}-${c.courier_service_code}`} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${shippingCourier === c.courier_service_code ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="courier"
                          value={c.courier_service_code}
                          checked={shippingCourier === c.courier_service_code}
                          onChange={() => onCourierSelect(c)}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900 uppercase">
                            {c.courier_name} - {c.courier_service_name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            Estimasi: {c.duration}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        Rp {c.price.toLocaleString('id-ID')}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Silakan isi alamat pengiriman dengan lengkap terlebih dahulu untuk melihat pilihan kurir.</p>
              )
            )}
          </div>
        )}

        {deliveryType === 'PICKUP' && (
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Instruksi Pengambilan
            </h4>
            {loadingInstructions ? (
              <div className="animate-pulse h-10 bg-amber-100 rounded"></div>
            ) : (
              <p className="text-sm text-amber-800 whitespace-pre-line">
                {pickupInstructions || 'Barang dapat diambil di Gudang Arianation. Harap bawa Nomor Pesanan Anda sebagai bukti pengambilan.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingMethodSelector;
