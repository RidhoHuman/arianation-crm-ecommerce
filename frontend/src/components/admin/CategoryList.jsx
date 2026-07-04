import React, { useEffect, useState } from 'react';
import useCategoryStore from '../../store/categoryStore';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CategoryList({ businessType = 'FASHION_RETAIL' }) {
  const { categories, isLoading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    longDescription: '',
    purpose: '',
    highlights: '',
    useCases: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCategories({ businessType });
  }, [fetchCategories, businessType]);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setImageFile(null);
      setFormData({
        name: category.name,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        longDescription: category.longDescription || '',
        purpose: category.purpose || '',
        highlights: category.highlights ? (typeof category.highlights === 'string' ? JSON.parse(category.highlights) : category.highlights).join(', ') : '',
        useCases: category.useCases ? (typeof category.useCases === 'string' ? JSON.parse(category.useCases) : category.useCases).join(', ') : '',
        isActive: category.isActive,
      });
    } else {
      setEditingId(null);
      setImageFile(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        longDescription: '',
        purpose: '',
        highlights: '',
        useCases: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Disable form interactions or show loading indicator locally if store doesn't handle image upload state well
    // But store isLoading is handled by fetch, we will handle our own upload await.

    let finalImageUrl = formData.imageUrl;

    if (imageFile) {
      try {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        
        const uploadRes = await api.post('/products/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Akses URL dari format response backend: uploadRes.data adalah JSON, dan didalamnya ada object data
        if (uploadRes.data?.data?.url) {
          finalImageUrl = uploadRes.data.data.url;
        } else if (uploadRes.data?.url) {
          // Fallback jika format response berbeda
          finalImageUrl = uploadRes.data.url;
        }
      } catch (err) {
        alert('Gagal mengupload gambar banner: ' + (err.response?.data?.message || err.message));
        return; // Jangan lanjutkan simpan jika gagal upload
      }
    }

    // Parse highlights and useCases to arrays
    const payload = {
      ...formData,
      imageUrl: finalImageUrl,
      businessType,
      highlights: formData.highlights ? formData.highlights.split(',').map(i => i.trim()).filter(Boolean) : null,
      useCases: formData.useCases ? formData.useCases.split(',').map(i => i.trim()).filter(Boolean) : null,
    };

    let result;
    if (editingId) {
      result = await updateCategory(editingId, payload, { businessType });
    } else {
      result = await createCategory(payload, { businessType });
    }

    if (result.success) {
      toast.success(editingId ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!');
      handleCloseModal();
    } else {
      toast.error('Gagal menyimpan kategori.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      const result = await deleteCategory(id, { businessType });
      if (result && result.success) {
        toast.success('Kategori berhasil dihapus!');
      }
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {businessType === 'FASHION_RETAIL' ? 'Kategori Retail' : 'Kategori Sablon'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {businessType === 'FASHION_RETAIL' 
              ? 'Kelola kategori produk untuk E-Commerce Anda' 
              : 'Kelola kategori bahan dasar untuk Custom Sablon'}
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30"
        >
          <FiPlus /> Tambah Kategori
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FiTag className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-700">Belum ada kategori</p>
                      <p className="text-sm mt-1">Klik tombol "Tambah Kategori" untuk memulai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description || 'Tidak ada deskripsi'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {cat.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(cat)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <FiTrash2 />
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

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Supporter Culture"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Banner</label>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 transition"
                    />
                  </div>
                  {imageFile && (
                    <p className="text-xs text-green-600 mt-1">✓ File siap diupload ({imageFile.name})</p>
                  )}
                  {!imageFile && formData.imageUrl && (
                    <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                      <span>Gambar saat ini:</span>
                      <img src={formData.imageUrl} alt="Banner" className="w-20 h-auto rounded border border-gray-200" />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Pilih file untuk mengupload gambar baru.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Deskripsi singkat kategori ini..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artikel Kategori (Long Description)</label>
                <textarea 
                  value={formData.longDescription}
                  onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Tuliskan artikel atau narasi lengkap tentang kategori ini..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (Tujuan / Mengapa kategori ini ada)</label>
                <textarea 
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Dibuat khusus untuk Anda yang..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (Karakteristik)</label>
                  <textarea 
                    value={formData.highlights}
                    onChange={(e) => setFormData({...formData, highlights: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Minimalist, Nyaman dipakai seharian, Earth tones (pisahkan dengan koma)"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">Pisahkan tiap poin dengan koma</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Cases (Momen Terbaik)</label>
                  <textarea 
                    value={formData.useCases}
                    onChange={(e) => setFormData({...formData, useCases: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nonton konser, Naik gunung, Jalan-jalan (pisahkan dengan koma)"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">Pisahkan tiap poin dengan koma</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6 pb-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30 disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
