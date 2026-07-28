import React, { useEffect, useState } from 'react';
import useBannerStore from '../../store/bannerStore';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiUploadCloud } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function BannerList() {
  const { banners, isLoading, error, fetchBanners, createBanner, updateBanner, deleteBanner } = useBannerStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    page_location: 'home',
    imageUrl: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    orderIndex: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingId(banner.id);
      setFormData({
        page_location: banner.page_location,
        imageUrl: banner.imageUrl,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        buttonText: banner.buttonText || '',
        buttonLink: banner.buttonLink || '',
        orderIndex: banner.orderIndex || 0,
        isActive: banner.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        page_location: 'home',
        imageUrl: '',
        title: '',
        subtitle: '',
        buttonText: '',
        buttonLink: '',
        orderIndex: 0,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBanner(editingId, formData);
        toast.success('Banner berhasil diperbarui!');
      } else {
        await createBanner(formData);
        toast.success('Banner berhasil ditambahkan!');
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan banner.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus banner ini?`)) {
      try {
        await deleteBanner(id);
        toast.success('Banner berhasil dihapus!');
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus banner.');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vercel Serverless Function payload limit is 4.5MB
    if (file.size > 4.5 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar. Maksimal 4.5 MB.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);

    setIsUploading(true);
    try {
      const { data } = await api.post('/products/upload-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // The server wraps the payload in a 'data' property: { success, data: { url: ... }, message }
      setFormData({ ...formData, imageUrl: data?.data?.url || '' });
    } catch (error) {
      alert('Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && banners.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Banner</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola slide banner untuk halaman utama (Home)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30"
        >
          <FiPlus /> Tambah Banner
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
                <th className="px-6 py-4">Gambar</th>
                <th className="px-6 py-4">Lokasi & Urutan</th>
                <th className="px-6 py-4">Judul</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FiImage className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-700">Belum ada banner</p>
                      <p className="text-sm mt-1">Klik tombol "Tambah Banner" untuk memulai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <img src={banner.imageUrl} alt="Banner" className="w-32 h-16 object-cover rounded shadow-sm" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 mb-1">
                        {banner.page_location === 'sablon_cta' ? 'Custom Sablon CTA' : 'Hero Home'}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Urutan: {banner.orderIndex}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{banner.title || '(Tanpa Judul)'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {banner.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(banner)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
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
                {editingId ? 'Edit Banner' : 'Tambah Banner'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Banner *</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {formData.imageUrl ? (
                        <div className="relative">
                          <img src={formData.imageUrl} alt="Preview" className="mx-auto h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <>
                          <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                          {isUploading && <p className="text-xs text-blue-500 mt-2">Mengunggah...</p>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">ATAU LINK URL</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="mt-2 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Banner *</label>
                  <select
                    value={formData.page_location}
                    onChange={(e) => setFormData({ ...formData, page_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="home">Hero Banner (Halaman Utama)</option>
                    <option value="sablon_cta">Custom Sablon CTA (Halaman Utama)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: Lifestyle for Every Moment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: Premium streetwear crafted..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teks Tombol</label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: DISCOVER COLLECTION"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Tombol</label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: /category/stories"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urutan (Angka)</label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Tampilkan Banner (Aktif)</span>
                  </label>
                </div>
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
                  disabled={isLoading || isUploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/30 disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
