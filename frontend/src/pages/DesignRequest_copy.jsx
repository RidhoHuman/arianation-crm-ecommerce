import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';

// Variants for framer motion
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function DesignRequest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setLoading = useUIStore((s) => s.setLoading);
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const designSchema = React.useMemo(() => z.object({
    designTitle: z.string().min(3, 'Judul proyek wajib diisi'),
    purpose: z.string().min(2, 'Tujuan penggunaan wajib diisi'),
    deadline: z.string().min(1, 'Target selesai wajib diisi'),
    productTypeForSablon: z.string().min(1, 'Pilih jenis bahan dasar'),
    quantity: z.number().min(12, 'Minimal order 12 pcs'),
    sizeBreakdown: z.string().min(1, 'Rincian ukuran wajib diisi (misal: S:3, M:5)'),
    colorPreferences: z.string().min(2, 'Warna kaos wajib diisi'),
    printPosition: z.string().min(1, 'Posisi sablon wajib diisi'),
    printTechnique: z.string().min(1, 'Teknik sablon wajib dipilih'),
    numberOfColors: z.number().min(1, 'Jumlah warna wajib diisi'),
    picName: z.string().min(2, 'Nama PIC wajib diisi'),
    whatsappNumber: z.string().min(9, 'Nomor WhatsApp valid wajib diisi'),
    shippingAddress: z.string().min(10, 'Alamat pengiriman wajib diisi'),
    shippingNotes: z.string().optional(),
    designDescription: z.string().optional(),
  }), []);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(designSchema),
    defaultValues: {
      quantity: 12,
      productTypeForSablon: 'Cotton Combed 30s',
      printTechnique: 'DTF',
      numberOfColors: 1,
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setFileError('Ukuran file melebihi batas 50MB');
        setFile(null);
      } else {
        setFileError('');
        setFile(selectedFile);
      }
    }
  };

  const onSubmit = async (data) => {
    if (!isAuthenticated) return;
    if (!file) {
      setFileError('File desain wajib diunggah');
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      formData.append('designFile', file);
      
      await api.post('/design-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal mengirim permintaan desain');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-16 mb-24 text-center">
        <div className="w-20 h-20 bg-aria-charcoal text-white rounded-full flex items-center justify-center mx-auto mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-3xl font-display font-medium uppercase tracking-widest text-aria-charcoal dark:text-white mb-4">
          Permintaan Terkirim
        </h2>
        <p className="text-sm text-gray-500 uppercase tracking-widest leading-relaxed max-w-lg mx-auto mb-10">
          Terima kasih! Tim produksi kami akan segera mereview spesifikasi dan artwork Anda. Kami akan menghubungi Anda melalui WhatsApp dalam waktu 1x24 jam untuk penawaran harga.
        </p>
        <Link to="/account" className="inline-block border border-aria-charcoal dark:border-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-aria-charcoal hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
          Cek Status Pesanan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <SEOHead title="Custom Sablon & Merchandise | ARIANATION" description="Layanan sablon custom premium untuk brand, komunitas, dan event." />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight mb-6">
              Bring Your Design <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">To Life.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-600 dark:text-gray-400 uppercase tracking-widest leading-relaxed mb-10">
              Layanan sablon premium untuk merchandise event, seragam komunitas, atau brand clothing Anda. Kualitas distro, proses transparan, garansi 100%.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a href="#form-section" className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-10 py-5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-colors w-full sm:w-auto">
                Mulai Konsultasi (Gratis)
              </a>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Harga mulai dari Rp 55.000/pcs*
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-gray-100 dark:bg-gray-900 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 dark:bg-gray-800 rounded-full blur-3xl opacity-50 -z-10"></div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">Garansi Sablon</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Hasil tidak sesuai mockup? Cetak ulang GRATIS. Tinta luntur? Garansi tukar baru hingga 6 bulan.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">Tepat Waktu</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Manajemen produksi ketat menjamin pesanan Anda selesai sesuai deadline. Tanpa alasan mundur.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3">Detail Spesifik</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Mockup presisi tinggi sebelum naik cetak. Anda tahu persis apa yang akan Anda dapatkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section className="py-24 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-4">Our Work</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest max-w-2xl mx-auto">
              Portofolio hasil produksi nyata. Kami percaya kualitas harus dibuktikan dengan hasil, bukan sekadar janji.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Portfolio Item 1 */}
            <div className="group border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="relative h-80 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Kaos Komunitas" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4 bg-black text-white text-[10px] uppercase tracking-widest px-3 py-1">
                  100 Pcs / Event
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">Urban Street Festival</h3>
                <p className="text-xs text-gray-500 mb-4">Cotton Combed 30s • Sablon Plastisol (3 Warna)</p>
                <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800 mb-4"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">"Warna solid, tidak pecah ditarik, pengiriman H-2 acara sudah sampai. Sangat direkomendasikan!" - Penyelenggara</p>
              </div>
            </div>
            
            {/* Portfolio Item 2 */}
            <div className="group border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="relative h-80 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Merch Band" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4 bg-black text-white text-[10px] uppercase tracking-widest px-3 py-1">
                  50 Pcs / Band Merch
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">The Nightfall Tour Merch</h3>
                <p className="text-xs text-gray-500 mb-4">Heavy Cotton 20s • Sablon DTF High-Res</p>
                <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800 mb-4"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">"Detail artwork yang sangat rumit berhasil dicetak dengan sempurna menggunakan DTF. Fanbase sangat suka." - Band Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materials & Print Techniques */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Material Guide */}
            <div>
              <h2 className="text-xl font-display font-medium uppercase tracking-widest mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">Our Materials</h2>
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Cotton Combed 30s</h3>
                  <p className="text-xs text-gray-500 mb-4">Standar distro premium. Gramasi 140-150gsm. Adem, menyerap keringat, anti-pilling.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800">Best Seller</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Cotton Bamboo</h3>
                  <p className="text-xs text-gray-500 mb-4">Ultra soft, anti-bakteri alami, sangat nyaman untuk iklim tropis dan olahraga ringan.</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800">Premium</span>
                </div>
              </div>
            </div>

            {/* Technique Guide */}
            <div>
              <h2 className="text-xl font-display font-medium uppercase tracking-widest mb-8 border-b border-gray-300 dark:border-gray-700 pb-4">Print Techniques</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">Teknik</th>
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">Karakteristik</th>
                      <th className="py-4 font-semibold uppercase tracking-wider text-xs">Kekurangan</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-600 dark:text-gray-400">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">DTF (Direct to Film)</td>
                      <td className="py-4">Full color, gradasi halus, resolusi tinggi (1440dpi)</td>
                      <td className="py-4">Harga relatif lebih tinggi untuk ukuran besar</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">Plastisol (Manual)</td>
                      <td className="py-4">Warna sangat solid, awet bertahun-tahun, tekstur karet</td>
                      <td className="py-4">Terbatas untuk desain solid (bukan foto/gradasi)</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-4 font-semibold text-black dark:text-white">Polyflex</td>
                      <td className="py-4">Hasil matte/glossy presisi, cocok untuk nama/nomor</td>
                      <td className="py-4">Tidak cocok untuk desain dengan banyak detail kecil</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-16">Workflow Proses</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Submit Form</h3>
              <p className="text-xs text-gray-500">Lengkapi form spesifikasi dan unggah desain.</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Quotation</h3>
              <p className="text-xs text-gray-500">Kami cek & berikan estimasi harga (1x24 jam).</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Mockup Approval</h3>
              <p className="text-xs text-gray-500">Preview digital sebelum produksi massal (1-2 hari).</p>
              <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-4 font-bold bg-black text-white dark:bg-white dark:text-black">4</div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Production</h3>
              <p className="text-xs text-gray-500">Produksi dikerjakan presisi (7-10 hari kerja).</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Form Section */}
      <section id="form-section" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-display font-medium uppercase tracking-widest mb-2 text-center">Mulai Pesanan Custom</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-12">Isi detail di bawah seakurat mungkin untuk penawaran terbaik</p>

            {!isAuthenticated ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4">Login Diperlukan</h3>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                  Untuk alasan keamanan transaksi, riwayat penawaran harga, dan pelacakan *progress* secara real-time, Anda diwajibkan untuk masuk atau mendaftar akun terlebih dahulu sebelum mengajukan pesanan custom.
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/login?redirect=/custom-design" className="bg-aria-charcoal text-white dark:bg-white dark:text-black px-8 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="border border-aria-charcoal dark:border-white px-8 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Daftar Baru
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                
                {/* 1. Informasi Proyek */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">1. Informasi Proyek</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Judul / Nama Proyek *</label>
                      <input {...register('designTitle')} placeholder="Contoh: Kaos Panitia Event X" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.designTitle && <span className="text-xs text-red-500">{errors.designTitle.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Tujuan Penggunaan *</label>
                      <select {...register('purpose')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                        <option value="">Pilih Tujuan...</option>
                        <option value="Event/Acara">Event / Kepanitiaan</option>
                        <option value="Merchandise Brand">Merchandise Brand (Retail)</option>
                        <option value="Komunitas">Seragam Komunitas / Kantor</option>
                        <option value="Hadiah/Pribadi">Hadiah / Keperluan Pribadi</option>
                      </select>
                      {errors.purpose && <span className="text-xs text-red-500">{errors.purpose.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Target Selesai (Deadline) *</label>
                      <input type="date" {...register('deadline')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.deadline && <span className="text-xs text-red-500">{errors.deadline.message}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Spesifikasi Produk */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">2. Spesifikasi Produk</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Bahan Dasar *</label>
                      <select {...register('productTypeForSablon')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                        <option value="Cotton Combed 30s">Cotton Combed 30s</option>
                        <option value="Cotton Combed 24s">Cotton Combed 24s</option>
                        <option value="Cotton Bamboo">Cotton Bamboo</option>
                        <option value="Fleece (Hoodie)">Fleece (Hoodie / Sweater)</option>
                        <option value="Lacoste (Polo)">Lacoste (Polo Shirt)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Warna Kain *</label>
                      <input {...register('colorPreferences')} placeholder="Contoh: Hitam Solid, atau kombinasi" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.colorPreferences && <span className="text-xs text-red-500">{errors.colorPreferences.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Total Quantity (Pcs) *</label>
                      <input type="number" {...register('quantity', { valueAsNumber: true })} min="1" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.quantity && <span className="text-xs text-red-500">{errors.quantity.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Rincian Ukuran *</label>
                      <input {...register('sizeBreakdown')} placeholder="Contoh: S:10, M:20, L:15, XL:5" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.sizeBreakdown && <span className="text-xs text-red-500">{errors.sizeBreakdown.message}</span>}
                    </div>
                  </div>
                </div>

                {/* 3. Teknis Sablon & Artwork */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">3. Sablon & Desain</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Teknik Sablon *</label>
                      <select {...register('printTechnique')} className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white appearance-none">
                        <option value="DTF">DTF (Direct to Film) - Full Color</option>
                        <option value="Plastisol">Plastisol (Manual) - Warna Solid</option>
                        <option value="Rubber">Rubber (Manual)</option>
                        <option value="Polyflex">Polyflex - Nama/Nomor</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Jumlah Warna (Khusus Manual) *</label>
                      <input type="number" {...register('numberOfColors', { valueAsNumber: true })} min="1" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Posisi Sablon *</label>
                      <input {...register('printPosition')} placeholder="Contoh: Dada kiri (logo 10cm), Punggung A4" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.printPosition && <span className="text-xs text-red-500">{errors.printPosition.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Unggah File Artwork / Mockup *</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                        <input type="file" onChange={handleFileChange} className="mx-auto block text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-gray-100 file:text-black hover:file:bg-gray-200" accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr" />
                        <p className="text-xs text-gray-500 mt-2">Format: PNG (min 300dpi), PDF, AI, atau CDR. Maks 50MB.</p>
                        {fileError && <p className="text-xs text-red-500 mt-2">{fileError}</p>}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Catatan Khusus Desain</label>
                      <textarea {...register('designDescription')} rows={3} placeholder="Instruksi khusus terkait warna pantone, ukuran pasti, dll..." className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"></textarea>
                    </div>
                  </div>
                </div>

                {/* 4. Kontak & Pengiriman */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">4. Kontak & Pengiriman</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Nama PIC *</label>
                      <input {...register('picName')} placeholder="Nama Penanggung Jawab" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.picName && <span className="text-xs text-red-500">{errors.picName.message}</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">No. WhatsApp *</label>
                      <input {...register('whatsappNumber')} placeholder="08123456789" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                      {errors.whatsappNumber && <span className="text-xs text-red-500">{errors.whatsappNumber.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Alamat Pengiriman *</label>
                      <textarea {...register('shippingAddress')} rows={3} placeholder="Alamat lengkap, kodepos, patokan..." className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"></textarea>
                      {errors.shippingAddress && <span className="text-xs text-red-500">{errors.shippingAddress.message}</span>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Catatan Ekspedisi (Opsional)</label>
                      <input {...register('shippingNotes')} placeholder="Contoh: Tolong pakai ekspedisi Cargo X" className="w-full border border-gray-300 dark:border-gray-700 p-3 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white" />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                  <button type="submit" disabled={!file || submitError || fileError} className="w-full bg-aria-charcoal text-white dark:bg-white dark:text-black py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors disabled:opacity-50">
                    Kirim Permintaan Sablon
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Dengan mengirimkan form ini, Anda menyetujui Syarat & Ketentuan layanan custom ARIANATION.
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}
