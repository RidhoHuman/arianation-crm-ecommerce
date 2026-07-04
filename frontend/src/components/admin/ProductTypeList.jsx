import React, { useEffect, useState } from 'react';
import useProductTypeStore from '../../store/productTypeStore';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function ProductTypeList() {
  const { types, isLoading, error, fetchTypes, createType, updateType, deleteType } = useProductTypeStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    typeName: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingId(type.id);
      setFormData({
        typeName: type.typeName,
        imageUrl: type.imageUrl || '',
        isActive: type.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        typeName: '',
        imageUrl: '',
        isActive: true,
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
        toast.error('Gagal mengupload gambar tipe: ' + (err.response?.data?.message || err.message));
        return;
      }
    }

    const submissionData = {
      ...formData,
      imageUrl: finalImageUrl,
    };

    try {
      if (editingId) {
        await updateType(editingId, submissionData);
        toast.success('Tipe produk berhasil diperbarui!');
      } else {
        await createType(submissionData);
        toast.success('Tipe produk berhasil ditambahkan!');
      }
      handleCloseModal();
    } catch (err) {
      toast.error('Gagal menyimpan tipe produk.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tipe "${name}"?`)) {
      try {
        await deleteType(id);
        toast.success('Tipe produk berhasil dihapus!');
      } catch (err) {
        toast.error('Gagal menghapus tipe produk.');
      }
    }
  };

  if (isLoading && types.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Tipe (By Type)</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola sub-kategori/tipe produk untuk menu Navbar Retail E-Commerce</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30"
        >
          <FiPlus /> Tambah Tipe
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
                <th className="px-6 py-4">Nama Tipe</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {types.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FiTag className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-700">Belum ada tipe produk</p>
                      <p className="text-sm mt-1">Klik tombol "Tambah Tipe" untuk memulai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {type.imageUrl ? (
                            <img src={type.imageUrl} alt={type.typeName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <FiTag />
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800">{type.typeName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {type.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {type.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleOpenModal(type)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title="Edit"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id, type.typeName)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Hapus"
                        >
                          <FiTrash2 className="text-lg" />
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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Tipe Produk' : 'Tambah Tipe Baru'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Tipe <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.typeName}
                  onChange={(e) => setFormData({...formData, typeName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: T-Shirts, Hoodies..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Banner Tipe (Opsional)</label>
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
                        <div className="flex text-sm text-gray-600 justify-center mt-2">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload file</span>
                            <input type="file" className="sr-only" accept="image/*" onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setImageFile(e.target.files[0]);
                              }
                            }} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Aktifkan tipe ini (muncul di Navbar)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 pb-2">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30 disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Tipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
