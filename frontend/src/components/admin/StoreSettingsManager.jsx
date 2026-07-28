import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSave, FiSettings } from 'react-icons/fi';

export default function StoreSettingsManager() {
  const [settings, setSettings] = useState({
    welcome_bonus_points: '',
    points_earning_rate: '',
    review_text_points: '',
    review_image_points: '',
    points_exchange_rate: '',
    max_points_discount_percentage: '',
    best_seller_threshold: '',
    pickup_instructions: '',
    store_postal_code: '',
    sablon_tier1_max_qty: '',
    sablon_tier1_min_days: '',
    sablon_tier2_max_qty: '',
    sablon_tier2_min_days: '',
    sablon_tier3_min_days: '',
    tier_silver_min: '',
    tier_gold_min: '',
    tier_platinum_min: '',
    tier_silver_discount: '',
    tier_gold_discount: '',
    tier_platinum_discount: ''
  });
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [resSettings, resCouriers] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/couriers')
      ]);
      setSettings(resSettings.data.data);
      if (resCouriers.data.data) {
        setCouriers(resCouriers.data.data);
      }
    } catch (error) {
      alert('Gagal memuat pengaturan toko');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide after 3s
    } catch (error) {
      alert('Gagal menyimpan pengaturan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCourier = async (code, currentStatus) => {
    try {
      await api.put(`/admin/couriers/${code}/toggle`, { isActive: !currentStatus });
      setCouriers(prev => prev.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (error) {
      alert('Gagal mengubah status kurir');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center dark:text-white">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight dark:text-white flex items-center gap-3">
            <FiSettings className="text-aria-maroon" />
            Pengaturan Toko & CRM
          </h2>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi variabel global untuk operasional toko Anda.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* CRM Settings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              Sistem Loyalitas (CRM)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Bonus Poin Pengguna Baru
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="welcome_bonus_points"
                    value={settings.welcome_bonus_points || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 5"
                    min="0"
                  />
                  <span className="absolute right-3 top-3 text-sm text-gray-400">Poin</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Jumlah "Aria Points" otomatis yang diberikan saat kustomer baru berhasil mendaftar (Register).
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Poin Pembelanjaan (Earn Rate)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-gray-400">Rp</span>
                  <input
                    type="number"
                    name="points_earning_rate"
                    value={settings.points_earning_rate || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 pl-9 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 10000"
                    min="1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Nominal belanja (Rupiah) untuk mendapatkan 1 Poin.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Poin Ulasan (Hanya Teks)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="review_text_points"
                    value={settings.review_text_points || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 100"
                    min="0"
                  />
                  <span className="absolute right-3 top-3 text-sm text-gray-400">Poin</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Poin hadiah untuk ulasan tanpa melampirkan foto.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Poin Ulasan (Dengan Foto)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="review_image_points"
                    value={settings.review_image_points || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 500"
                    min="0"
                  />
                  <span className="absolute right-3 top-3 text-sm text-gray-400">Poin</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Poin ekstra hadiah untuk ulasan yang melampirkan foto.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nilai Tukar Poin (Burn Rate)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-gray-400">Rp</span>
                  <input
                    type="number"
                    name="points_exchange_rate"
                    value={settings.points_exchange_rate || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 pl-9 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 10"
                    min="1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Nilai 1 Poin dalam Rupiah saat ditukarkan. Misal: 10 berarti 1 Poin = Potongan Rp 10.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Batas Maksimal Penggunaan Poin (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="max_points_discount_percentage"
                    value={settings.max_points_discount_percentage || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 50"
                    min="1"
                    max="100"
                  />
                  <span className="absolute right-3 top-3 text-sm text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Maksimal potongan dari total belanja. Misal: 50 berarti maks potong 50% tagihan.
                </p>
              </div>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 mt-8 border-b border-gray-100 dark:border-gray-700 pb-2">
              Pengaturan Customer Tier (Otomatis)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SILVER TIER */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex justify-between items-center">
                  SILVER 
                  <span className="text-xs font-normal text-gray-500">Tier Menengah</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ambang Batas Belanja (Rp)</label>
                    <input
                      type="number"
                      name="tier_silver_min"
                      value={settings.tier_silver_min || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 500000"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Diskon Pesanan (%)</label>
                    <input
                      type="number"
                      name="tier_silver_discount"
                      value={settings.tier_silver_discount || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 5"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* GOLD TIER */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                <h4 className="font-bold text-amber-700 dark:text-amber-500 mb-3 flex justify-between items-center">
                  GOLD 
                  <span className="text-xs font-normal opacity-70">Tier Tinggi</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Ambang Batas Belanja (Rp)</label>
                    <input
                      type="number"
                      name="tier_gold_min"
                      value={settings.tier_gold_min || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 2000000"
                      className="w-full border border-amber-300 dark:border-amber-700/50 rounded p-2 text-sm focus:ring-1 focus:ring-amber-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Diskon Pesanan (%)</label>
                    <input
                      type="number"
                      name="tier_gold_discount"
                      value={settings.tier_gold_discount || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 10"
                      className="w-full border border-amber-300 dark:border-amber-700/50 rounded p-2 text-sm focus:ring-1 focus:ring-amber-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* PLATINUM TIER */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30 md:col-span-2">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex justify-between items-center">
                  PLATINUM 
                  <span className="text-xs font-normal opacity-70">Tier Tertinggi</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Ambang Batas Belanja (Rp)</label>
                    <input
                      type="number"
                      name="tier_platinum_min"
                      value={settings.tier_platinum_min || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 5000000"
                      className="w-full border border-indigo-300 dark:border-indigo-700/50 rounded p-2 text-sm focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Diskon Pesanan (%)</label>
                    <input
                      type="number"
                      name="tier_platinum_discount"
                      value={settings.tier_platinum_discount || ''}
                      onChange={handleChange}
                      placeholder="Contoh: 15"
                      className="w-full border border-indigo-300 dark:border-indigo-700/50 rounded p-2 text-sm focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3">
                  Tier Bronze tidak perlu diatur karena merupakan tier default (batas Rp 0, diskon 0%).
                </p>
              </div>
            </div>
          </div>

          {/* Store Settings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              Tampilan Toko (Etalase)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Batas Label "Best Seller"
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="best_seller_threshold"
                    value={settings.best_seller_threshold || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 5"
                    min="1"
                  />
                  <span className="absolute right-3 top-3 text-sm text-gray-400">Terjual</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Produk otomatis mendapat label "Best Seller" jika telah terjual minimal sebanyak angka ini.
                </p>
              </div>
            </div>
          </div>

            {/* Smart Date Sablon Settings */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                Pengaturan Smart Date (Custom Sablon)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-3">Pesanan Skala Kecil</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Maksimal Qty (pcs)</label>
                      <input
                        type="number"
                        name="sablon_tier1_max_qty"
                        value={settings.sablon_tier1_max_qty || ''}
                        onChange={handleChange}
                        placeholder="Contoh: 11"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Minimal Waktu (Hari)</label>
                      <input
                        type="number"
                        name="sablon_tier1_min_days"
                        value={settings.sablon_tier1_min_days || ''}
                        onChange={handleChange}
                        placeholder="Contoh: 7"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-3">Pesanan Skala Menengah</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Maksimal Qty (pcs)</label>
                      <input
                        type="number"
                        name="sablon_tier2_max_qty"
                        value={settings.sablon_tier2_max_qty || ''}
                        onChange={handleChange}
                        placeholder="Contoh: 100"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Minimal Waktu (Hari)</label>
                      <input
                        type="number"
                        name="sablon_tier2_min_days"
                        value={settings.sablon_tier2_min_days || ''}
                        onChange={handleChange}
                        placeholder="Contoh: 14"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-3">Pesanan Skala Besar</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Maksimal Qty (pcs)</label>
                      <input
                        type="text"
                        disabled
                        value="> Skala Menengah"
                        className="w-full border border-gray-200 rounded p-2 text-sm bg-gray-100 text-gray-500 dark:bg-gray-900 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Minimal Waktu (Hari)</label>
                      <input
                        type="number"
                        name="sablon_tier3_min_days"
                        value={settings.sablon_tier3_min_days || ''}
                        onChange={handleChange}
                        placeholder="Contoh: 30"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Pengaturan ini akan langsung mengunci kalender di form permintaan sablon pelanggan jika jumlah melebihi ketentuan. Kosongkan untuk menggunakan default sistem.
              </p>
            </div>
  
          {/* Omnichannel Settings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              Omnichannel (Logistik & Pickup)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Kode Pos Toko (Origin Postal Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="store_postal_code"
                    value={settings.store_postal_code || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 65141 (Malang) atau 12110 (Jakarta)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Titik asal perhitungan ongkir kurir otomatis (Biteship). Jika kosong, menggunakan pengaturan sistem default.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Instruksi "Ambil di Toko"
                </label>
                <textarea
                  name="pickup_instructions"
                  value={settings.pickup_instructions || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-aria-maroon dark:bg-gray-700 dark:text-white"
                  placeholder="Contoh: Silakan datang ke toko dengan membawa KTP dan ID Pesanan..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Instruksi ini akan ditampilkan kepada kustomer saat mereka memilih opsi "Ambil di Toko", dan juga akan disertakan dalam email konfirmasi.
                </p>
              </div>
            </div>
          </div>

          {/* Courier Management */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              Manajemen Kurir (Biteship)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {couriers.map((courier) => (
                <div key={courier.code} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{courier.name}</span>
                    <span className="text-xs text-gray-500">{courier.code}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={Boolean(courier.isActive)} 
                      onChange={() => handleToggleCourier(courier.code, Boolean(courier.isActive))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-aria-maroon"></div>
                  </label>
                </div>
              ))}
            </div>
            {couriers.length === 0 && (
              <p className="text-sm text-gray-500 italic">Belum ada data kurir dari Biteship.</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-4">
            {saveSuccess && (
              <span className="text-green-600 dark:text-green-400 font-medium text-sm flex items-center gap-1 animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Tersimpan!
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-aria-maroon text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              <FiSave />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
