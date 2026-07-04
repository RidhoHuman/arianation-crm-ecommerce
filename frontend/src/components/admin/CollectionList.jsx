import React, { useEffect, useState } from 'react';
import useCollectionStore from '../../store/collectionStore';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiLayers } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CollectionList() {
  const { collections, isLoading, error, fetchCollections, createCollection, updateCollection, deleteCollection } = useCollectionStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setEditingId(collection.id);
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        imageUrl: collection.imageUrl || '',
        isActive: collection.isActive,
        is_featured: collection.is_featured ? true : false,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        isActive: true,
        is_featured: false,
      });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalImageUrl = formData.imageUrl;

    if (imageFile) {
      try {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        
        const uploadRes = await api.post('/products/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data?.data?.url) {
          finalImageUrl = uploadRes.data.data.url;
        } else if (uploadRes.data?.url) {
          finalImageUrl = uploadRes.data.url;
        }
      } catch (err) {
        alert('Gagal mengupload gambar koleksi: ' + (err.response?.data?.message || err.message));
        return;
      }
    }

    const submissionData = {
      ...formData,
      imageUrl: finalImageUrl,
    };

    let result;
    if (editingId) {
      result = await updateCollection(editingId, submissionData);
    } else {
      result = await createCollection(submissionData);
    }

    if (result.success) {
      toast.success(editingId ? 'Koleksi berhasil diperbarui!' : 'Koleksi berhasil ditambahkan!');
      handleCloseModal();
    } else {
      toast.error('Gagal menyimpan koleksi.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus koleksi "${name}"?`)) {
      const result = await deleteCollection(id);
      if (result && result.success) {
        toast.success('Koleksi berhasil dihapus!');
      }
    }
  };

  if (isLoading && collections.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Koleksi</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola koleksi pilihan (Featured, Promo, dll) untuk E-Commerce Anda</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30"
        >
          <FiPlus /> Tambah Koleksi
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
                <th className="px-6 py-4">Nama Koleksi</th>
                <th className="px-6 py-4">Slug / URL</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FiLayers className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-700">Belum ada koleksi</p>
                      <p className="text-sm mt-1 max-w-md mx-auto text-center text-gray-500">
                        Koleksi memungkinkan Anda mengelompokkan dan menonjolkan produk tertentu (misal: "Promo Kemerdekaan" atau "Best Seller"). 
                        Klik tombol "Tambah Koleksi" untuk membuat grup produk kurasi pertama Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                collections.map((col) => (
                  <tr key={col.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {col.imageUrl ? (
                            <img src={col.imageUrl} alt={col.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <FiLayers />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{col.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{col.description || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {col.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${col.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {col.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${col.is_featured ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {col.is_featured ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(col)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDelete(col.id, col.name)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">
                {editingId ? 'Edit Koleksi' : 'Tambah Koleksi'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koleksi *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Summer Vibes 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Otomatis jika dikosongkan"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat (Card)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Deskripsi singkat yang tampil di halaman Semua Produk..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Koleksi (Opsional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {(imageFile || formData.imageUrl) ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} 
                          alt="Preview" 
                          className="h-32 object-contain mb-3 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setFormData({...formData, imageUrl: ''});
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Hapus Gambar
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload file</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setImageFile(e.target.files[0]);
                              }
                            }} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                      </>
                    )}
                  </div>
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

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-gray-700">Tampilkan di Homepage (Featured)</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 pb-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30"
                >
                  Simpan Koleksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
