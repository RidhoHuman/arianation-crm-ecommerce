import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSave, FiSettings } from 'react-icons/fi';

export default function StoreSettingsManager() {
  const [settings, setSettings] = useState({
    welcome_bonus_points: '',
    best_seller_threshold: '',
    pickup_instructions: ''
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

          {/* Omnichannel Settings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-aria-charcoal dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              Omnichannel (Logistik & Pickup)
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
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
                  Instruksi ini akan ditampilkan kepada kustomer saat mereka memilih opsi "Ambil di Toko", dan juga akan disertakan dalam email konfirmasi. Gunakan baris baru (Enter) untuk memisahkan poin.
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
