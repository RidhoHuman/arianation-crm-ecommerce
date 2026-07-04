import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FiX, FiStar, FiUpload } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

export default function ReviewModal({ isOpen, onClose, orderItem, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUser } = useAuthStore();

  if (!isOpen || !orderItem) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Ulasan tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      // 1. Upload image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        // We use the existing upload endpoint
        const uploadRes = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      // 2. Submit review
      const res = await api.post('/reviews', {
        productId: orderItem.productId,
        orderId: orderId,
        rating,
        comment,
        imageUrl
      });

      if (res.data.success) {
        toast.success(res.data.message);

        // Update user points in store
        if (user && res.data.data.newTotalPoints) {
          setUser({ ...user, rewardPoints: res.data.data.newTotalPoints });
        }

        onSuccess(orderItem.productId);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Beri Ulasan Produk</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
              {orderItem.productImage ? (
                <img src={orderItem.productImage} alt={orderItem.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white line-clamp-2">{orderItem.productName}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Variasi: {orderItem.color}, {orderItem.size}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Penilaian Anda</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <FiStar
                    size={32}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tulis Pengalaman Anda <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-aria-maroon bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Bagaimana kualitas bahan dan sablonnya? Apakah ukurannya pas?"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tambahkan Foto (Dapat +500 Poin!)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-aria-maroon hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    <FiUpload className="mx-auto text-gray-400" size={24} />
                    <span className="text-[10px] text-gray-500 mt-1 block">Upload</span>
                  </div>
                )}
              </label>
              <div className="flex-1">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex items-start gap-2">
                  <FiStar className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Sertakan foto produk saat dipakai atau foto detail sablon untuk membantu kustomer lain. Anda akan mendapat insentif <strong>+500 Aria Points</strong> (Foto) atau +100 Poin (Hanya Teks).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 py-3 px-4 bg-aria-maroon text-white rounded-lg font-bold text-sm hover:bg-red-800 transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Kirim Ulasan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
