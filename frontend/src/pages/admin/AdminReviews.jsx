import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import useUIStore from '../../store/uiStore';

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'none'} stroke={filled ? '#FBBF24' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ambil state mode colorblind
  const isColorblindMode = useUIStore((state) => state.isColorblindMode);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reviews');
      setReviews(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Gagal mengambil data ulasan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ulasan ini? (Tindakan ini tidak dapat dibatalkan)')) {
      return;
    }
    
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews(reviews.filter((r) => r.id !== id));
      alert('Ulasan berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus ulasan', err);
      alert('Gagal menghapus ulasan. Silakan coba lagi.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display uppercase tracking-tight">Manajemen Ulasan</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau dan moderasi ulasan pelanggan.</p>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-md text-sm font-medium ${isColorblindMode ? 'bg-blue-100 text-blue-800' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-aria-maroon border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Produk</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Pelanggan</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Rating</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-widest min-w-[300px]">Ulasan</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      Belum ada ulasan.
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 align-top">
                        <span className="font-medium text-sm text-gray-900 dark:text-white block">{rev.productName}</span>
                        <span className="text-xs text-gray-500 mt-1 block">ID: {rev.productId.substring(0,8)}...</span>
                      </td>
                      <td className="p-4 align-top">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white block">{rev.userName}</span>
                        <span className="text-xs text-gray-500 block">{rev.userEmail}</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                           {new Date(rev.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex">
                          {[1,2,3,4,5].map(star => <StarIcon key={star} filled={star <= rev.rating} />)}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{rev.comment}</p>
                        {rev.imageUrl && (
                          <div className="mt-2 w-16 h-16 rounded border border-gray-200 overflow-hidden">
                            <img src={rev.imageUrl} alt="Review attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right align-top">
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className={`text-xs px-3 py-1.5 font-semibold rounded transition-colors ${
                            isColorblindMode
                              ? 'text-white bg-blue-600 hover:bg-blue-700'
                              : 'text-white bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
