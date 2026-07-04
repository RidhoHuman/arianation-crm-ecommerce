import React from 'react';
import SEOHead from '../components/SEOHead';
import Breadcrumb from '../components/Breadcrumb';
import FAQ from '../components/FAQ';
import { motion } from 'framer-motion';
import useUIStore from '../store/uiStore';

const TRANSLATIONS = {
  ID: {
    title: "FAQ & Pusat Bantuan",
    desc: "Pusat bantuan dan pertanyaan yang sering diajukan seputar layanan, pengiriman, pembayaran, dan garansi di Arianation.",
    heading: "Pusat Bantuan",
    subheading: "Jawaban untuk pertanyaan umum seputar Arianation. Jika Anda tidak menemukan jawaban yang Anda cari, silakan hubungi tim kami.",
    faqTitle: "Pertanyaan Umum",
    faqs: [
      {
        question: 'Berapa lama waktu pengiriman?',
        answer: 'Kami menawarkan pengiriman standar 3-5 hari kerja ke seluruh Indonesia. Pengiriman express tersedia untuk area Jakarta dalam 1-2 hari kerja dengan biaya tambahan.',
      },
      {
        question: 'Apakah bisa custom design?',
        answer: 'Ya, kami menyediakan layanan custom sablon dengan desain sesuai keinginan Anda. Hubungi tim support kami untuk konsultasi gratis dan penawaran harga.',
      },
      {
        question: 'Bagaimana proses return/retur produk?',
        answer: 'Produk dapat diretur dalam 14 hari jika cacat produksi atau tidak sesuai pesanan. Hubungi customer service kami dengan bukti pembelian untuk proses pengembalian dana.',
      },
      {
        question: 'Apakah ada jaminan kualitas?',
        answer: 'Semua produk kami dijamin 100% original dengan standar kualitas distro premium. Kami memberikan garansi jahitan dan warna.',
      },
      {
        question: 'Metode pembayaran apa saja yang tersedia?',
        answer: 'Kami menerima transfer bank, kartu kredit, e-wallet (OVO, Dana, GoPay), dan cicilan 0% melalui bank mitra. Semua transaksi dienkripsi dan aman.',
      },
      {
        question: 'Apakah ada diskon untuk pembelian dalam jumlah besar?',
        answer: 'Ya, kami menawarkan harga spesial untuk pembelian grosir atau komunitas. Hubungi tim penjualan kami untuk harga khusus.',
      },
    ]
  },
  EN: {
    title: "FAQ & Help Center",
    desc: "Help center and frequently asked questions regarding services, shipping, payments, and warranties at Arianation.",
    heading: "Help Center",
    subheading: "Answers to common questions about Arianation. If you don't find the answer you're looking for, please contact our team.",
    faqTitle: "General Questions",
    faqs: [
      {
        question: 'How long does shipping take?',
        answer: 'We offer standard shipping of 3-5 business days across Indonesia. Express shipping is available for the Jakarta area in 1-2 business days for an additional fee.',
      },
      {
        question: 'Can I request a custom design?',
        answer: 'Yes, we provide custom screen printing services with designs tailored to your preferences. Contact our support team for a free consultation and quote.',
      },
      {
        question: 'What is the return process?',
        answer: 'Products can be returned within 14 days if there is a manufacturing defect or the order is incorrect. Contact our customer service with your proof of purchase for a refund process.',
      },
      {
        question: 'Is there a quality guarantee?',
        answer: 'All our products are 100% guaranteed original with premium quality standards. We provide warranties for stitching and color durability.',
      },
      {
        question: 'What payment methods are available?',
        answer: 'We accept bank transfers, credit cards, e-wallets (OVO, Dana, GoPay), and 0% installments through partner banks. All transactions are encrypted and secure.',
      },
      {
        question: 'Are there discounts for bulk purchases?',
        answer: 'Yes, we offer special pricing for wholesale or community bulk purchases. Contact our sales team for special rates.',
      },
    ]
  }
};

export default function FAQPage() {
  const language = useUIStore((s) => s.language);
  const t = TRANSLATIONS[language] || TRANSLATIONS.ID;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 min-h-screen pb-16"
    >
      <SEOHead 
        title={t.title} 
        description={t.desc}
      />

      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb 
          items={[
            { label: 'Home', path: '/' },
            { label: 'FAQ', path: '/faq' }
          ]} 
        />
        
        <div className="mt-8 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-display font-bold uppercase tracking-tight mb-4">{t.heading}</h1>
            <p className="text-gray-500 uppercase tracking-widest text-sm leading-relaxed">
              {t.subheading}
            </p>
          </div>
          
          <div className="bg-white dark:bg-black p-8 shadow-sm border border-gray-200 dark:border-gray-800">
            <FAQ faqs={t.faqs} title={t.faqTitle} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
