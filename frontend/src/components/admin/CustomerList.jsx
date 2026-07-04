import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiMail, FiSearch, FiShoppingBag, FiCalendar, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
  // Promo Modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoData, setPromoData] = useState({ subject: '', message: '' });
  const [promoLoading, setPromoLoading] = useState(false);

  // Manage Customer Modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [manageForm, setManageForm] = useState({ isActive: true, currentTier: 'BRONZE', pointsAdjustment: '' });
  const [manageLoading, setManageLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers', { params: { search: searchQuery } });
      setCustomers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleSendPromo = async (e) => {
    e.preventDefault();
    setPromoLoading(true);

    try {
      const res = await api.post('/admin/customers/promo', promoData);
      toast.success(res.data.message || 'Promo email berhasil dikirim');
      setTimeout(() => {
        setShowPromoModal(false);
        setPromoData({ subject: '', message: '' });
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim promo email');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleOpenManage = (customer) => {
    setSelectedCustomer(customer);
    setManageForm({
      isActive: customer.isActive === 1 || customer.isActive === true,
      currentTier: customer.currentTier || 'BRONZE',
      pointsAdjustment: ''
    });
    setShowManageModal(true);
  };

  const handleSaveManage = async (e) => {
    e.preventDefault();
    setManageLoading(true);
    try {
      await api.put(`/admin/customers/${selectedCustomer.id}`, {
        isActive: manageForm.isActive,
        currentTier: manageForm.currentTier,
        pointsAdjustment: manageForm.pointsAdjustment ? Number(manageForm.pointsAdjustment) : undefined
      });
      toast.success('Data pelanggan berhasil diperbarui');
      setShowManageModal(false);
      fetchCustomers(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data pelanggan');
    } finally {
      setManageLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Pelanggan (CRM)</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola relasi dan pantau riwayat belanja pelanggan Anda</p>
        </div>
        <button 
          onClick={() => setShowPromoModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <FiMail className="text-lg" /> Kirim Promo Email
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email pelanggan..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </form>
        <div className="text-sm text-gray-500 font-medium">
          Total: {customers.length} Pelanggan
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Status & Tier</th>
                <th className="px-6 py-4 text-center">Aria Points</th>
                <th className="px-6 py-4 text-center">Transaksi</th>
                <th className="px-6 py-4 text-right">Total LTV (Spend)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Tidak ada pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold uppercase">
                          {(customer.fullName || customer.email).charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{customer.fullName || customer.email.split('@')[0]}</div>
                          <div className="text-gray-500 text-sm">{customer.email}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <FiCalendar /> Sejak: {new Date(customer.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {customer.isActive ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Aktif</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">Diblokir</span>
                        )}
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          customer.currentTier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                          customer.currentTier === 'GOLD' ? 'bg-amber-100 text-amber-700' :
                          customer.currentTier === 'SILVER' ? 'bg-gray-200 text-gray-700' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {customer.currentTier || 'BRONZE'} TIER
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-amber-500">
                      {customer.rewardPoints || 0} pts
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs">
                        <FiShoppingBag /> {customer.totalOrders} 
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                      Rp {customer.totalSpent?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenManage(customer)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Email Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiMail className="text-blue-600" /> Kirim Promo Email Massal
              </h3>
              <button 
                onClick={() => setShowPromoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSendPromo} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subjek Email *</label>
                <input 
                  type="text"
                  required
                  value={promoData.subject}
                  onChange={(e) => setPromoData({...promoData, subject: e.target.value})}
                  placeholder="Cth: Diskon Spesial Lebaran 50%!"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Isi Pesan Promo *</label>
                <textarea 
                  required
                  rows="6"
                  value={promoData.message}
                  onChange={(e) => setPromoData({...promoData, message: e.target.value})}
                  placeholder="Tuliskan penawaran menarik Anda di sini..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">Pesan ini akan dikirim ke seluruh pelanggan yang aktif ({customers.length} orang).</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={promoLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {promoLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Mengirim...</>
                  ) : (
                    <><FiMail /> Kirim Sekarang</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Customer Modal */}
      {showManageModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-xl font-bold text-gray-800">Kelola Pelanggan</h3>
              <button 
                onClick={() => setShowManageModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSaveManage} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <p className="font-semibold text-blue-900">{selectedCustomer.fullName}</p>
                  <p className="text-sm text-blue-700">{selectedCustomer.email}</p>
                  <p className="text-sm font-bold text-amber-600 mt-2">Saldo: {selectedCustomer.rewardPoints || 0} Poin</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status Akun</label>
                  <select
                    value={manageForm.isActive ? '1' : '0'}
                    onChange={e => setManageForm({...manageForm, isActive: e.target.value === '1'})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="1">Aktif (Dapat Login & Transaksi)</option>
                    <option value="0">Diblokir (Suspended)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Tier</label>
                  <select
                    value={manageForm.currentTier}
                    onChange={e => setManageForm({...manageForm, currentTier: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="BRONZE">BRONZE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Penyesuaian Poin (Aria Points)</label>
                  <input 
                    type="number"
                    value={manageForm.pointsAdjustment}
                    onChange={(e) => setManageForm({...manageForm, pointsAdjustment: e.target.value})}
                    placeholder="Contoh: 100 atau -50"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Gunakan minus (-) untuk mengurangi poin, contoh: -50</p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50/50">
                <button 
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 bg-white text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={manageLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {manageLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
