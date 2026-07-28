import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    store_postal_code: '',
    best_seller_threshold: '',
    pickup_instructions: '',
    welcome_bonus_points: '',
    points_earning_rate: '',
    review_text_points: '',
    review_image_points: '',
    points_exchange_rate: '',
    max_points_discount_percentage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings({
          store_postal_code: res.data.data.store_postal_code || '',
          best_seller_threshold: res.data.data.best_seller_threshold || '',
          pickup_instructions: res.data.data.pickup_instructions || '',
          welcome_bonus_points: res.data.data.welcome_bonus_points || '',
          points_earning_rate: res.data.data.points_earning_rate || '',
          review_text_points: res.data.data.review_text_points || '',
          review_image_points: res.data.data.review_image_points || '',
          points_exchange_rate: res.data.data.points_exchange_rate || '',
          max_points_discount_percentage: res.data.data.max_points_discount_percentage || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Gagal memuat pengaturan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-6">Pengaturan Toko</h2>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shipping Settings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Pengaturan Pengiriman (Shipping)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Pos Toko (Origin Postal Code)
              </label>
              <input
                type="text"
                name="store_postal_code"
                value={settings.store_postal_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 65141 (Malang) atau 12110 (Jakarta)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Titik asal perhitungan ongkir kurir otomatis (Biteship). Jika kosong, menggunakan pengaturan sistem default.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruksi Pengambilan (Store Pickup)
              </label>
              <textarea
                name="pickup_instructions"
                value={settings.pickup_instructions}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Instruksi untuk pelanggan saat mengambil pesanan di gudang/toko..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 mt-8">Pengaturan Produk & Tampilan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambang Batas "Best Seller" (Best Seller Threshold)
              </label>
              <input
                type="number"
                name="best_seller_threshold"
                value={settings.best_seller_threshold}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Jumlah minimal produk terjual agar mendapat label "Best Seller".
              </p>
            </div>
          </div>
        </div>

        {/* Aria Points Settings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 mt-8">Manajemen Aria Points</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poin Bonus Pendaftaran Akun (Welcome Bonus)
              </label>
              <input
                type="number"
                name="welcome_bonus_points"
                min="0"
                value={settings.welcome_bonus_points}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Jumlah poin yang diberikan otomatis saat pelanggan membuat akun baru.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Poin Pembelanjaan (Rupiah/Poin)
              </label>
              <input
                type="number"
                name="points_earning_rate"
                min="1"
                value={settings.points_earning_rate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 10000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Berapa nominal Rupiah untuk mendapatkan 1 Poin. Misal: 10000 berarti Rp 10.000 = 1 Poin.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poin Ulasan (Hanya Teks)
              </label>
              <input
                type="number"
                name="review_text_points"
                min="0"
                value={settings.review_text_points}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Poin hadiah untuk ulasan tanpa melampirkan foto.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poin Ulasan (Dengan Foto)
              </label>
              <input
                type="number"
                name="review_image_points"
                min="0"
                value={settings.review_image_points}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Poin ekstra hadiah untuk ulasan yang melampirkan foto.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nilai Tukar Poin (Burn Rate)
              </label>
              <input
                type="number"
                name="points_exchange_rate"
                min="1"
                value={settings.points_exchange_rate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Nilai 1 Poin dalam Rupiah saat ditukarkan. Misal: 10 berarti 1 Poin = Potongan Rp 10.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batas Maksimal Penggunaan Poin (%)
              </label>
              <input
                type="number"
                name="max_points_discount_percentage"
                min="1"
                max="100"
                value={settings.max_points_discount_percentage}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-aria-charcoal"
                placeholder="Contoh: 50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maksimal potongan dari total belanja. Misal: 50 berarti kustomer hanya bisa memotong maks 50% dari tagihan.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-aria-charcoal text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
