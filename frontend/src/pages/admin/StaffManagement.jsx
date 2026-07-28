import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Search, Mail, Phone, Calendar } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function StaffManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/staff');
      setAdmins(data.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error(error.response?.data?.message || 'Gagal mengambil data staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/staff', formData);
      toast.success('Admin baru berhasil ditambahkan');
      setIsAddModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', password: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.put(`/staff/${selectedAdmin.id}/reset-password`, { newPassword });
      toast.success('Password admin berhasil direset');
      setIsResetModalOpen(false);
      setNewPassword('');
      setSelectedAdmin(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mereset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus admin ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      await api.delete(`/staff/${adminId}`);
      toast.success('Admin berhasil dihapus');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aria-maroon"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Staf</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola akun administrator sistem (Owner Privilege)</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-aria-charcoal text-white rounded-lg hover:bg-aria-maroon transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Admin
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Admin</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Kontak</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Bergabung</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-aria-cream text-aria-charcoal flex items-center justify-center font-bold">
                        {admin.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{admin.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Role: {admin.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4" />
                        {admin.email}
                      </div>
                      {admin.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Phone className="w-4 h-4" />
                          {admin.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {admin.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setIsResetModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors tooltip"
                      title="Reset Password"
                    >
                      <Key className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors tooltip"
                      title="Hapus Admin"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada admin yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Admin Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-aria-maroon"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-aria-maroon"
                  placeholder="admin@arianation.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. HP (Opsional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-aria-maroon"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Awal</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-aria-maroon"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-aria-charcoal text-white rounded-lg hover:bg-aria-maroon transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reset Password</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Masukkan password baru untuk <span className="font-bold">{selectedAdmin.fullName}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-aria-maroon"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-aria-charcoal text-white rounded-lg hover:bg-aria-maroon transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
