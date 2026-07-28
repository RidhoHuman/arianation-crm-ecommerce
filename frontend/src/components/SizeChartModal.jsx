import React from 'react';
import { FiX } from 'react-icons/fi';

export default function SizeChartModal({ isOpen, onClose, imageUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-gray-800">Panduan Ukuran (Size Chart)</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto bg-gray-50 flex justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Size Chart" className="w-full h-auto object-contain rounded-lg" />
          ) : (
            <p className="text-gray-500 italic py-8 text-center">Gambar Size Chart tidak tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
