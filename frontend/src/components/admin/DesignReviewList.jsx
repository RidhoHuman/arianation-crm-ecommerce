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
  const [selectedFile, setSelectedFile] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const getWhatsAppLink = (req) => {
    if (!req.whatsappNumber) return '#';
    let waNumber = req.whatsappNumber.replace(/\D/g, '');
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
    }
    const waText = `Halo Kak ${req.customerName || ''}, kami dari tim Arianation. Terkait pesanan Custom Sablon (${req.productTypeForSablon || 'Custom'}) dengan desain berjudul *"${req.designTitle}"*, kami ingin melakukan konfirmasi desain (Mockup Final) sebelum masuk ke tahap produksi...`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
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
    setSelectedFile(null);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      let status = (actionType === 'APPROVE' || actionType === 'APPROVE_WITH_FILE') ? 'APPROVED' : 'REVISION_REQUESTED';
      if (actionType === 'REJECT') status = 'REJECTED';
      if (actionType === 'CANCEL') status = 'CANCELLED';

      let uploadedUrl = null;
      if (actionType === 'APPROVE_WITH_FILE' && selectedFile) {
        const formData = new FormData();
        formData.append('designFile', selectedFile);
        const uploadRes = await api.post(`/design-requests/upload-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = uploadRes.data.data.url;
      }

      await api.put(`/admin/design-requests/${selectedRequest.id}/status`, {
        status,
        comments,
        estimatedPrice: (actionType === 'APPROVE' || actionType === 'APPROVE_WITH_FILE') ? estimatedPrice : null,
        hppPrice: (actionType === 'APPROVE' || actionType === 'APPROVE_WITH_FILE') ? hppPrice : null,
        mockupPreviewUrl: uploadedUrl
      });
      
      let toastMessage = 'Request direvisi!';
      if (actionType === 'APPROVE' || actionType === 'APPROVE_WITH_FILE') toastMessage = 'Request disetujui!';
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
                {(req.mockupPreviewUrl || req.designFileUrl) ? (
                  <img 
                    src={getImageUrl(req.mockupPreviewUrl || req.designFileUrl)} 
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
                  style={{ display: (req.mockupPreviewUrl || req.designFileUrl) ? 'none' : 'flex' }}
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
                    <p><span className="font-semibold text-gray-700">Posisi:</span> {req.printPosition || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-700">Ukuran Sablon:</span> {req.printSize || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-700">Warna Produk:</span> {req.colorPreferences || 'N/A'}</p>
                    <p><span className="font-semibold text-gray-700">Ukuran Baju/Tas:</span> {req.sizeBreakdown || 'N/A'}</p>
                    <p className="pt-1 border-t border-gray-200 mt-1"><span className="font-semibold text-gray-800">Estimasi Sistem:</span> <span className="text-blue-700 font-bold">Rp {Number(req.estimatedPrice || 0).toLocaleString('id-ID')}</span></p>
                  </div>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                  {req.designDescription || 'Tidak ada deskripsi dari customer.'}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {req.designFileUrl && (
                    <a 
                      href={getImageUrl(req.designFileUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium flex items-center gap-1 w-max bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100"
                    >
                      <FiImage /> File Desain
                    </a>
                  )}
                  {req.mockupPreviewUrl && (
                    <a 
                      href={getImageUrl(req.mockupPreviewUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-purple-600 hover:text-purple-800 hover:underline text-xs font-medium flex items-center gap-1 w-max bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-100"
                    >
                      <FiImage /> Mockup
                    </a>
                  )}
                  {req.whatsappNumber && (
                    <a 
                      href={getWhatsAppLink(req)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-green-700 hover:text-green-800 hover:underline text-xs font-medium flex items-center gap-1 w-max bg-green-50 px-2 py-1.5 rounded-lg border border-green-200"
                      title="Kirim konfirmasi via WhatsApp"
                    >
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                      Hubungi WA
                    </a>
                  )}
                </div>
                
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
                    <>
                      <button 
                          onClick={() => openModal(req, 'CANCEL')}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <FiX /> Batalkan
                      </button>
                      <button 
                          onClick={() => openModal(req, 'APPROVE_WITH_FILE')}
                          className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg flex flex-col items-center justify-center transition-colors border border-blue-200"
                        >
                          Upload Final
                      </button>
                    </>
                  ) : (
                    <>
                      <button disabled className="flex-1 py-2 bg-gray-50 text-gray-400 font-medium text-xs rounded-lg cursor-not-allowed">
                        Telah Di-review
                      </button>
                      {(req.status === 'REVISION_REQUESTED') && (
                         <button 
                            onClick={() => openModal(req, 'APPROVE_WITH_FILE')}
                            className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg flex items-center justify-center transition-colors border border-blue-200"
                          >
                            Upload Final
                        </button>
                      )}
                    </>
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
            <div className={`p-5 border-b border-gray-100 flex justify-between items-center shrink-0 ${['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? 'bg-green-50' : actionType === 'REJECT' ? 'bg-red-50' : actionType === 'CANCEL' ? 'bg-gray-100' : 'bg-orange-50'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? 'text-green-800' : actionType === 'REJECT' ? 'text-red-800' : actionType === 'CANCEL' ? 'text-gray-800' : 'text-orange-800'}`}>
                {['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? <><FiCheckCircle /> {actionType === 'APPROVE_WITH_FILE' ? 'Upload Final & Setujui' : 'Setujui & Beri Harga'}</> : actionType === 'REJECT' ? <><FiX /> Tolak Desain</> : actionType === 'CANCEL' ? <><FiX /> Batalkan Penawaran</> : <><FiAlertCircle /> Minta Revisi Desain</>}
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

                {actionType === 'APPROVE_WITH_FILE' && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-blue-800 border-b border-blue-200 pb-2 flex items-center gap-2"><FiImage /> Upload Final Mockup</h4>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">File Gambar (Wajib)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        required
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="w-full text-xs border border-blue-200 rounded p-1 bg-white"
                      />
                      <p className="text-[10px] text-blue-600 mt-1">Upload desain final yang sudah Anda kerjakan. Kustomer akan melihat file ini saat membayar.</p>
                    </div>
                  </div>
                )}
                
                {['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) && (
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
                    <FiMessageSquare /> {['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? 'Catatan (Opsional)' : actionType === 'REVISE' ? 'Detail Revisi (Wajib)' : 'Alasan (Wajib)'}
                  </label>
                  <textarea 
                    required={!['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType)}
                    rows="4"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? "Catatan untuk customer..." : actionType === 'REVISE' ? "Beri tahu customer bagian mana yang harus direvisi..." : "Berikan alasan pembatalan/penolakan..."}
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
                  className={`flex-1 py-2 text-white font-medium rounded-lg flex items-center justify-center gap-2 ${['APPROVE', 'APPROVE_WITH_FILE'].includes(actionType) ? 'bg-green-600 hover:bg-green-700' : actionType === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : actionType === 'CANCEL' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-orange-600 hover:bg-orange-700'}`}
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
