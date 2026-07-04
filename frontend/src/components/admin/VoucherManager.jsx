import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiSearch, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
    isPublic: true,
    expiresAt: '',
    targetTier: 'ALL'
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vouchers');
      setVouchers(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setIsEditing(true);
      setFormData({
        id: voucher.id,
        code: voucher.code,
        type: voucher.type,
        value: Math.round(Number(voucher.value)) || '',
        minPurchase: voucher.minPurchase ? Math.round(Number(voucher.minPurchase)) : '',
        maxDiscount: voucher.maxDiscount ? Math.round(Number(voucher.maxDiscount)) : '',
        usageLimit: voucher.usageLimit || '',
        isActive: voucher.isActive,
        isPublic: voucher.isPublic !== undefined ? voucher.isPublic : true,
        expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toISOString().slice(0, 16) : '',
        targetTier: voucher.targetTier || 'ALL'
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: '',
        code: '',
        type: 'PERCENTAGE',
        value: '',
        minPurchase: '',
        maxDiscount: '',
        usageLimit: '',
        isActive: true,
        isPublic: true,
        expiresAt: '',
        targetTier: 'ALL'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.code || !formData.value) {
      return toast.error('Kode dan Nilai Voucher wajib diisi');
    }

    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        minPurchase: formData.minPurchase ? Number(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isPublic: formData.isPublic,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        targetTier: formData.targetTier || 'ALL'
      };

      if (isEditing) {
        await api.put(`/vouchers/${formData.id}`, payload);
        toast.success('Voucher berhasil diperbarui');
      } else {
        await api.post('/vouchers', payload);
        toast.success('Voucher berhasil ditambahkan');
      }
      
      setShowModal(false);
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan voucher');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;
    
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher berhasil dihapus');
      fetchVouchers();
    } catch (error) {
      toast.error('Gagal menghapus voucher');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/vouchers/${id}`, { isActive: !currentStatus });
      toast.success('Status voucher diperbarui');
      fetchVouchers();
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Voucher</h1>
          <p className="text-gray-500 text-sm mt-1">Buat dan kelola kode promo diskon pelanggan</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" /> Buat Voucher Baru
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <FiTag className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p>Belum ada voucher yang tersedia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <th className="p-4">Kode</th>
                  <th className="p-4">Tipe & Nilai</th>
                  <th className="p-4">Target Tier</th>
                  <th className="p-4">Visibilitas</th>
                  <th className="p-4">Syarat</th>
                  <th className="p-4">Pemakaian</th>
                  <th className="p-4">Kadaluarsa</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredVouchers.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {v.code}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                      {v.type === 'PERCENTAGE' ? `${Math.round(Number(v.value))}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`}
                    </td>
                    <td className="p-4">
                      {v.targetTier === 'ALL' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">SEMUA</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">VIP {v.targetTier}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {v.isPublic ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <FiEye className="mr-1" /> PUBLIK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          <FiEyeOff className="mr-1 text-red-500" /> TERSEMBUNYI
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>Min: Rp {Number(v.minPurchase).toLocaleString('id-ID')}</div>
                      {v.type === 'PERCENTAGE' && v.maxDiscount > 0 && (
                        <div className="text-xs text-gray-500">Maks: Rp {Number(v.maxDiscount).toLocaleString('id-ID')}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1 mb-1">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: v.usageLimit ? `${Math.min((v.usedCount / v.usageLimit) * 100, 100)}%` : '100%' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {v.usedCount} / {v.usageLimit || '∞'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Selamanya'}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleActive(v.id, v.isActive)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${v.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${v.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit2 />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    {isEditing ? 'Edit Voucher' : 'Buat Voucher Baru'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Voucher *</label>
                      <input type="text" required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="Contoh: WELCOME20"
                        disabled={isEditing}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Potongan *</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          disabled={isEditing}
                        >
                          <option value="PERCENTAGE">Persentase (%)</option>
                          <option value="NOMINAL">Nominal (Rp)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nilai Potongan *</label>
                        <input type="number" required min="1"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.value}
                          onChange={(e) => setFormData({...formData, value: e.target.value})}
                          disabled={isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min. Belanja (Rp)</label>
                        <input type="number" min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.minPurchase}
                          onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maks. Diskon (Rp) {formData.type === 'NOMINAL' && '(Abaikan)'}</label>
                        <input type="number" min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.maxDiscount}
                          onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                          disabled={formData.type === 'NOMINAL'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batas Kuota Pemakaian</label>
                        <input type="number" min="1"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.usageLimit}
                          onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                          placeholder="Kosongkan jika unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kadaluarsa</label>
                        <input type="datetime-local"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Eksklusivitas (Kasta Kustomer)</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
                          value={formData.targetTier}
                          onChange={(e) => setFormData({...formData, targetTier: e.target.value})}
                        >
                          <option value="ALL">🌟 Berlaku untuk Semua Kustomer</option>
                          <option value="BRONZE">🥉 Khusus BRONZE</option>
                          <option value="SILVER">🥈 Khusus SILVER</option>
                          <option value="GOLD">🥇 Khusus GOLD</option>
                          <option value="PLATINUM">💎 Khusus PLATINUM (VIP)</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">*Jika diset selain "Semua", voucher hanya bisa dipakai kustomer di kasta tersebut.</p>
                      </div>
                      
                      <div>
                        <label className="flex items-center mt-6 cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={formData.isPublic}
                              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isPublic ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isPublic ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan di Halaman Checkout</span>
                            <span className="block text-[10px] text-gray-500 mt-0.5">
                              {formData.isPublic ? 'Aktif: Voucher akan terlihat oleh kustomer di Checkout.' : 'Nonaktif: Voucher disembunyikan (Cocok untuk Influencer/Afiliasi).'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    {isEditing ? 'Simpan' : 'Buat'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
