import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiImage, FiCheckCircle, FiAlertCircle, FiX, FiMessageSquare, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DesignReviewList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REVISE'
  const [comments, setComments] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [hppPrice, setHppPrice] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/design-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar request desain');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setComments('');
    setEstimatedPrice(request.estimatedPrice ? Math.round(Number(request.estimatedPrice)).toString() : '');
    setHppPrice('');
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      let status = actionType === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUESTED';
      if (actionType === 'REJECT') status = 'REJECTED';
      if (actionType === 'CANCEL') status = 'CANCELLED';

      await api.put(`/admin/design-requests/${selectedRequest.id}/status`, {
        status,
        comments,
        estimatedPrice: actionType === 'APPROVE' ? estimatedPrice : null,
        hppPrice: actionType === 'APPROVE' ? hppPrice : null
      });
      
      let toastMessage = 'Request direvisi!';
      if (actionType === 'APPROVE') toastMessage = 'Request disetujui!';
      else if (actionType === 'REJECT') toastMessage = 'Request ditolak!';
      else if (actionType === 'CANCEL') toastMessage = 'Penawaran dibatalkan!';
      
      toast.success(toastMessage);
      closeModal();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REVISION_REQUESTED: 'bg-orange-100 text-orange-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-200 text-gray-700',
    COMPLETED: 'bg-gray-100 text-gray-800',
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Review Desain Sablon</h2>
          <p className="text-gray-500 text-sm mt-1">Review permintaan desain dari customer, setujui, atau minta revisi.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {['ALL', 'PENDING', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
              filterStatus === status
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status === 'ALL' ? 'Semua Request' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grid of Design Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.filter(req => filterStatus === 'ALL' || req.status === filterStatus).length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
            <FiImage className="mx-auto text-4xl text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Request</h3>
            <p className="text-gray-500 text-sm">Permintaan desain kustom dari kustomer akan muncul di sini.</p>
          </div>
        ) : (
          requests.filter(req => filterStatus === 'ALL' || req.status === filterStatus).map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-48 bg-gray-100 relative group overflow-hidden">
                {req.designFileUrl ? (
                  <img 
                    src={getImageUrl(req.designFileUrl)} 
                    alt="Design Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex flex-col justify-center items-center text-gray-400 bg-gray-100"
                  style={{ display: req.designFileUrl ? 'none' : 'flex' }}
                >
                  <FiImage className="text-4xl mb-2" />
                  <span className="text-xs">File Tidak Ada</span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-2.5 py-1 font-bold rounded-md shadow-sm ${statusColors[req.status] || 'bg-gray-100'}`}>
                    {req.status}
                  </span>
                  {req.reminderCount > 0 && req.status === 'APPROVED' && (
                    <span className={`ml-2 text-[10px] px-2 py-0.5 font-bold rounded-full text-white shadow-sm ${req.reminderCount >= 4 ? 'bg-red-500' : 'bg-orange-500'}`}>
                      Diingatkan: {req.reminderCount}x
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={req.designTitle}>{req.designTitle}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2 mt-1">
                    {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                
                <div className="mb-3 space-y-1">
                  <p className="text-sm font-semibold text-blue-700">{req.customerName || 'Customer Anonim'}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">
                      {req.productTypeForSablon || 'N/A'}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">
                      Qty: {req.quantity || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 space-y-1">
                    <p><span className="font-semibold text-gray-700">Teknik:</span> {req.printTechnique || 'N/A'} ({req.numberOfColors || 1} Warna)</p>
                    <p><span className="font-semibold text-gray-700">Estimasi Sistem:</span> Rp {Number(req.estimatedPrice || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                  {req.designDescription || 'Tidak ada deskripsi dari customer.'}
                </p>

                {req.designFileUrl && (
                  <div className="mb-4">
                    <a 
                      href={getImageUrl(req.designFileUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium flex items-center gap-1 w-max bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                    >
                      <FiImage /> Buka/Unduh File Desain
                    </a>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100 flex gap-2">
                  {(req.status === 'SUBMITTED' || req.status === 'PENDING') ? (
                    <>
                      <button 
                        onClick={() => openModal(req, 'APPROVE')}
                        className="flex-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-xs rounded flex flex-col items-center justify-center transition-colors"
                      >
                        <FiCheckCircle className="mb-0.5" /> Terima
                      </button>
                      <button 
                        onClick={() => openModal(req, 'REVISE')}
                        className="flex-1 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 font-semibold text-xs rounded flex flex-col items-center justify-center transition-colors"
                      >
                        <FiAlertCircle className="mb-0.5" /> Revisi
                      </button>
                      <button 
                        onClick={() => openModal(req, 'REJECT')}
                        className="flex-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs rounded flex flex-col items-center justify-center transition-colors"
                      >
                        <FiX className="mb-0.5 text-sm" /> Tolak
                      </button>
                    </>
                  ) : req.status === 'APPROVED' ? (
                    <button 
                        onClick={() => openModal(req, 'CANCEL')}
                        className="w-full py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <FiX /> Batalkan Penawaran Sepihak
                    </button>
                  ) : (
                    <button disabled className="w-full py-2 bg-gray-50 text-gray-400 font-medium text-sm rounded-lg cursor-not-allowed">
                      Telah Di-review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`p-5 border-b border-gray-100 flex justify-between items-center shrink-0 ${actionType === 'APPROVE' ? 'bg-green-50' : actionType === 'REJECT' ? 'bg-red-50' : actionType === 'CANCEL' ? 'bg-gray-100' : 'bg-orange-50'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${actionType === 'APPROVE' ? 'text-green-800' : actionType === 'REJECT' ? 'text-red-800' : actionType === 'CANCEL' ? 'text-gray-800' : 'text-orange-800'}`}>
                {actionType === 'APPROVE' ? <><FiCheckCircle /> Setujui & Beri Harga</> : actionType === 'REJECT' ? <><FiX /> Tolak Desain</> : actionType === 'CANCEL' ? <><FiX /> Batalkan Penawaran</> : <><FiAlertCircle /> Minta Revisi Desain</>}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <FiX className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitAction} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <p className="text-sm text-gray-600 mb-4 border-l-4 border-gray-200 pl-3">
                  Aksi ini akan mengirimkan notifikasi email kepada kustomer.
                </p>
                
                {actionType === 'APPROVE' && (
                  <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">Kalkulator Harga & Margin</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Modal / HPP (Bahan Dasar + Sablon)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 font-medium">Rp</span>
                        <input 
                          type="number"
                          min="0"
                          value={hppPrice}
                          onChange={(e) => setHppPrice(e.target.value)}
                          placeholder="Cth: 100000"
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Masukkan total modal untuk pesanan ini agar Anda bisa melihat margin.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Penawaran Final (Tagihan Customer)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 font-medium">Rp</span>
                        <input 
                          type="number"
                          required
                          min="0"
                          value={estimatedPrice}
                          onChange={(e) => setEstimatedPrice(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700 bg-blue-50/30"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Sistem menyarankan estimasi awal: <strong className="text-gray-700">Rp {Number(selectedRequest.estimatedPrice || 0).toLocaleString('id-ID')}</strong></p>
                    </div>

                    {Number(hppPrice) > 0 && Number(estimatedPrice) > 0 && (
                      <div className={`p-3 rounded-lg flex justify-between items-center text-xs font-bold border ${Number(estimatedPrice) - Number(hppPrice) > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <span>Estimasi Margin Keuntungan:</span>
                        <span className="text-sm">
                          Rp {(Number(estimatedPrice) - Number(hppPrice)).toLocaleString('id-ID')} 
                          <span className="ml-1 text-[10px] font-medium opacity-80">
                            ({Math.round(((Number(estimatedPrice) - Number(hppPrice)) / Number(estimatedPrice)) * 100)}%)
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <FiMessageSquare /> {actionType === 'APPROVE' ? 'Catatan (Opsional)' : actionType === 'REVISE' ? 'Detail Revisi (Wajib)' : 'Alasan (Wajib)'}
                  </label>
                  <textarea 
                    required={actionType !== 'APPROVE'}
                    rows="4"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={actionType === 'APPROVE' ? "Catatan untuk customer..." : actionType === 'REVISE' ? "Beri tahu customer bagian mana yang harus direvisi..." : "Berikan alasan pembatalan/penolakan..."}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2 text-gray-600 bg-gray-100 font-medium rounded-lg hover:bg-gray-200">
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-2 text-white font-medium rounded-lg flex items-center justify-center gap-2 ${actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : actionType === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : actionType === 'CANCEL' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  {actionLoading ? 'Menyimpan...' : 'Kirim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
