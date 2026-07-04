import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function PortfolioManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Pakaian',
    sortOrder: 0,
    isActive: true,
  });
  const [file, setFile] = useState(null);
  const [editId, setEditId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portfolio/admin');
      if (res.data?.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      setError('Gagal memuat portofolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('sortOrder', formData.sortOrder);
      data.append('isActive', formData.isActive);
      if (file) {
        data.append('image', file);
      }

      if (editId) {
        await api.put(`/portfolio/${editId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Portofolio berhasil diperbarui!');
      } else {
        await api.post('/portfolio', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Portofolio berhasil ditambahkan!');
      }
      
      setShowForm(false);
      setFormData({ title: '', category: 'Pakaian', sortOrder: 0, isActive: true });
      setFile(null);
      setEditId(null);
      fetchItems();
    } catch (err) {
      toast.error('Gagal menyimpan portofolio');
      console.error(err);
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title || '',
      category: item.category || 'Pakaian',
      sortOrder: item.sortOrder || 0,
      isActive: Boolean(item.isActive),
    });
    setEditId(item.id);
    setShowForm(true);
    setFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus portofolio ini?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      toast.success('Portofolio berhasil dihapus!');
      fetchItems();
    } catch (err) {
      toast.error('Gagal menghapus portofolio');
    }
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    const cleanImg = img.startsWith('/') ? img : `/${img}`;
    return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + cleanImg : cleanImg;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Manajemen Portofolio Sablon</h2>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setFormData({ title: '', category: 'Pakaian', sortOrder: 0, isActive: true });
            setFile(null);
          }}
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
        >
          {showForm ? 'Batal' : '+ Tambah Portofolio'}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="font-bold text-lg">{editId ? 'Edit Portofolio' : 'Tambah Portofolio'}</h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                aria-label="Tutup Form"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul / Keterangan</label>
                  <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Contoh: Sablon DTF - Event Kampus" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition">
                    <option value="Pakaian">Pakaian</option>
                    <option value="Tas & Merchandise">Tas & Merchandise</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan Tampil</label>
                  <input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleInputChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  <p className="text-xs text-gray-500 mt-1">Angka lebih kecil tampil lebih awal (contoh: 1)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm">Aktif (Tampilkan di website)</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Gambar / Foto Hasil Sablon {editId && !file && <span className="text-gray-400 font-normal">(Kosongkan jika tidak ingin mengubah foto saat ini)</span>}
                  </label>
                  <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" className="w-full border p-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" required={!editId} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Gambar</th>
              <th className="px-6 py-4 font-semibold">Judul</th>
              <th className="px-6 py-4 font-semibold">Kategori</th>
              <th className="px-6 py-4 font-semibold">Urutan</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && !showForm ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Belum ada portofolio</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-6 py-4">
                    <img src={getImageUrl(item.imageUrl)} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 font-medium">{item.title}</td>
                  <td className="px-6 py-4 text-gray-600">{item.category}</td>
                  <td className="px-6 py-4">{item.sortOrder || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
