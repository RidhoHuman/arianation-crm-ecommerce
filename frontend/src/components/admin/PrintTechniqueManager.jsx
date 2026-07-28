import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import usePrintTechniqueStore from '../../store/printTechniqueStore';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function PrintTechniqueManager() {
  const { techniques, loading, error, fetchTechniquesAdmin, createTechnique, updateTechnique, deleteTechnique } = usePrintTechniqueStore();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowedCategories: [],
    minOrder: 1,
    pricingType: 'fixed',
    basePrice: 0,
    priceMatrix: {},
    maxColors: '',
    imageUrl: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTechniquesAdmin();
    fetchCategories();
  }, [fetchTechniquesAdmin]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat kategori');
    }
  };

  const handleOpenModal = (tech = null) => {
    if (tech) {
      setEditingId(tech.id);
      setFormData({
        name: tech.name || '',
        description: tech.description || '',
        allowedCategories: tech.allowedCategories || [],
        minOrder: tech.minOrder || 1,
        pricingType: tech.pricingType || 'fixed',
        basePrice: tech.basePrice || 0,
        priceMatrix: tech.priceMatrix || {},
        maxColors: tech.maxColors || '',
        imageUrl: tech.imageUrl || '',
        isActive: tech.isActive !== undefined ? tech.isActive : true
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        allowedCategories: [],
        minOrder: 1,
        pricingType: 'fixed',
        basePrice: 0,
        priceMatrix: {},
        maxColors: '',
        imageUrl: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleCheckboxChange = (categoryId) => {
    setFormData(prev => {
      const isSelected = prev.allowedCategories.includes(categoryId);
      return {
        ...prev,
        allowedCategories: isSelected 
          ? prev.allowedCategories.filter(id => id !== categoryId)
          : [...prev.allowedCategories, categoryId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        maxColors: formData.maxColors === '' ? null : parseInt(formData.maxColors)
      };

      if (editingId) {
        await updateTechnique(editingId, dataToSubmit);
        toast.success('Teknik sablon berhasil diperbarui');
      } else {
        await createTechnique(dataToSubmit);
        toast.success('Teknik sablon berhasil ditambahkan');
      }
      handleCloseModal();
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus teknik "${name}"?`)) {
      try {
        await deleteTechnique(id);
        toast.success('Teknik berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus teknik');
      }
    }
  };

  const getCategoryNames = (allowedIds) => {
    if (!allowedIds || allowedIds.length === 0) return '-';
    return allowedIds.map(id => {
      const cat = categories.find(c => c.id === id);
      return cat ? cat.categoryName : id;
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Teknik Sablon</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola jenis cetak, minimum order, dan kompatibilitas bahan</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Teknik Sablon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">Daftar Teknik Cetak / Sablon</h3>
          <button onClick={fetchTechniquesAdmin} className="text-gray-500 hover:text-black">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Nama Teknik</th>
                <th className="p-4 font-semibold text-gray-600">Kategori Bahan</th>
                <th className="p-4 font-semibold text-gray-600">Min. Order</th>
                <th className="p-4 font-semibold text-gray-600">Tipe Harga & Base</th>
                <th className="p-4 font-semibold text-gray-600">Max Warna</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && techniques.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : techniques.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Belum ada data teknik sablon.</td></tr>
              ) : (
                techniques.map((tech) => (
                  <tr key={tech.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-900 font-medium">{tech.name}</td>
                    <td className="p-4 text-sm text-gray-600">{getCategoryNames(tech.allowedCategories)}</td>
                    <td className="p-4 text-sm text-gray-600">{tech.minOrder} pcs</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="capitalize">{tech.pricingType.replace('_', ' ')}</div>
                      <div className="font-semibold text-gray-900">Rp {tech.basePrice.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{tech.maxColors || 'Tak Terbatas'}</td>
                    <td className="p-4">
                      {tech.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(tech)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(tech.id, tech.name)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Teknik Sablon' : 'Tambah Teknik Sablon'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Teknik *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black" placeholder="Contoh: DTF (Full Color)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black">
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black" placeholder="Penjelasan singkat untuk pelanggan..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order (MOQ) *</label>
                  <input type="number" min="1" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: parseInt(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Warna</label>
                  <input type="number" min="1" value={formData.maxColors} onChange={e => setFormData({...formData, maxColors: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black" placeholder="Kosongkan jika tak terbatas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Ikon/Gambar</label>
                  <input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black" placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Perhitungan Harga *</label>
                  <select value={formData.pricingType} onChange={e => setFormData({...formData, pricingType: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-black focus:border-black">
                    <option value="fixed">Fixed (Tetap)</option>
                    <option value="area_based">Berdasarkan Luas/Area/Ukuran</option>
                    <option value="color_based">Berdasarkan Jumlah Warna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dasar (Base Price) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input type="number" min="0" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value) || 0})} required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-black focus:border-black" />
                  </div>
                </div>
              </div>

              {formData.pricingType === 'area_based' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Matriks Harga Berdasarkan Ukuran</label>
                  <div className="space-y-3">
                    {Object.keys(formData.priceMatrix).map((sizeKey) => (
                      <div key={sizeKey} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={sizeKey}
                          readOnly
                          className="w-1/3 px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 font-medium cursor-not-allowed"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                          <input
                            type="number"
                            value={formData.priceMatrix[sizeKey]}
                            onChange={(e) => {
                              const newMatrix = { ...formData.priceMatrix };
                              newMatrix[sizeKey] = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, priceMatrix: newMatrix });
                            }}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-black focus:border-black"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newMatrix = { ...formData.priceMatrix };
                            delete newMatrix[sizeKey];
                            setFormData({ ...formData, priceMatrix: newMatrix });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Ukuran"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="text"
                        id="new-matrix-key"
                        placeholder="Contoh: A4, A3, Logo"
                        className="w-1/3 px-3 py-2 border rounded-lg focus:ring-black focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const keyInput = document.getElementById('new-matrix-key');
                          if (keyInput && keyInput.value.trim()) {
                            const newKey = keyInput.value.trim();
                            if (!formData.priceMatrix[newKey]) {
                              setFormData({
                                ...formData,
                                priceMatrix: { ...formData.priceMatrix, [newKey]: 0 }
                              });
                            }
                            keyInput.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                      >
                        Tambah Ukuran
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kompatibilitas Kategori Barang *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
                  {categories.filter(c => !c.businessType || c.businessType === 'SABLON_SERVICE').map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.allowedCategories.includes(cat.id)}
                        onChange={() => handleCheckboxChange(cat.id)}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{cat.categoryName}</span>
                    </label>
                  ))}
                  {categories.length === 0 && <span className="text-sm text-gray-500">Memuat kategori...</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 shrink-0">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-white bg-black rounded-lg hover:bg-gray-800 font-medium flex items-center gap-2">
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Simpan Teknik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
