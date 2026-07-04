import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function PromoEmailManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await api.get('/subscribers');
      setSubscribers(response.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data pelanggan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Subject dan pesan wajib diisi!');
      return;
    }

    if (!window.confirm('Kirim email ke SEMUA pelanggan aktif sekarang?')) return;

    setIsSending(true);
    try {
      const res = await api.post('/subscribers/send-promo', {
        subject,
        message,
        useTemplate
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Email berhasil dikirim!');
        setSubject('');
        setMessage('');
        if (res.data.previewUrl) {
           console.log("Email Preview:", res.data.previewUrl);
           toast.success("Mode Ethereal: Cek console untuk URL preview.");
        }
      } else {
        toast.error(res.data.message || 'Gagal mengirim email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim email');
    } finally {
      setIsSending(false);
    }
  };

  const activeSubscribers = subscribers.filter(s => s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promo Email Manager</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola newsletter dan kirim promosi</p>
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              activeTab === 'compose' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            Tulis Email
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              activeTab === 'subscribers' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Pelanggan ({activeSubscribers.length})
          </button>
        </div>
      </div>

      {activeTab === 'compose' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-w-4xl">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold">Tulis Pesan Promosi</h3>
            <p className="text-sm text-gray-500">Email akan dikirim ke {activeSubscribers.length} pelanggan aktif.</p>
          </div>
          
          <form onSubmit={handleSend} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjek Email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Rilisan Baru! Diskon 50% untuk Koleksi Musim Panas"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Promosi</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="8"
                placeholder="Tulis pesan promosi Anda di sini..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                required
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="useTemplate"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="w-5 h-5 text-black rounded focus:ring-black border-gray-300"
              />
              <label htmlFor="useTemplate" className="text-sm text-gray-700 font-medium">
                Gunakan Template Khusus AriaNation (dengan Logo dan Format Rapi)
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSending || activeSubscribers.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    MENGIRIM...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    KIRIM EMAIL SEKARANG
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold">Daftar Pelanggan</h3>
            <button onClick={fetchSubscribers} className="text-gray-500 hover:text-black">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                  <th className="p-4 font-semibold text-gray-600">Email</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Tanggal Langganan</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">
                      Belum ada pelanggan.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-900 font-medium">{sub.email}</td>
                      <td className="p-4">
                        {sub.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <AlertCircle className="w-3 h-3" /> Berhenti
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(sub.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
