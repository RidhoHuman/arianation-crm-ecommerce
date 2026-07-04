import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * FAQ Component dengan JSON-LD Schema
 * Menampilkan FAQ accordion + markup untuk Google
 * Tampil di Google Search sebagai "People also ask" atau FAQ rich snippet
 */
export default function FAQ({ faqs = [], title = 'Frequently Asked Questions' }) {
  const [expanded, setExpanded] = useState(0);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Generate JSON-LD structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* FAQ Accordion UI */}
      <section className="max-w-2xl mx-auto py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-colors"
            >
              <button
                onClick={() => setExpanded(expanded === index ? -1 : index)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 flex justify-between items-center font-semibold text-left text-gray-900 dark:text-white transition-colors"
                aria-expanded={expanded === index}
              >
                <span>{item.question}</span>
                <span className="text-xl">
                  {expanded === index ? '−' : '+'}
                </span>
              </button>

              {expanded === index && (
                <div className="px-6 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Pre-built FAQ data untuk common e-commerce questions
 * Customize sesuai dengan kebutuhan Arianation
 */
export const defaultEcommerceFAQs = [
  {
    question: 'Berapa lama waktu pengiriman?',
    answer: 'Kami menawarkan pengiriman standar 3-5 hari kerja ke seluruh Indonesia. Pengiriman express tersedia untuk area Jakarta dalam 1-2 hari kerja dengan biaya tambahan.',
  },
  {
    question: 'Apakah bisa custom design?',
    answer: 'Ya, kami menyediakan layanan custom sablon dengan desain sesuai keinginan Anda. Hubungi tim support kami untuk konsultasi gratis dan quotes harga.',
  },
  {
    question: 'Bagaimana proses return/retur produk?',
    answer: 'Produk dapat diretur dalam 14 hari jika cacat produksi atau tidak sesuai pesanan. Hubungi customer service kami dengan bukti pembelian untuk proses pengembalian dana.',
  },
  {
    question: 'Apakah ada jaminan kualitas?',
    answer: 'Semua produk kami dijamin 100% original dengan standar kualitas internasional. Kami memberikan garansi kualitas jahitan dan warna selama 1 tahun.',
  },
  {
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer: 'Kami menerima transfer bank, kartu kredit, e-wallet (GCash, OVO, Dana), dan cicilan 0% melalui bank mitra. Semua transaksi dienkripsi dan aman.',
  },
  {
    question: 'Apakah ada diskon untuk pembelian dalam jumlah besar?',
    answer: 'Ya, kami menawarkan harga spesial untuk pembelian corporate/wholesale. Hubungi tim penjualan kami untuk quote dan terms khusus.',
  },
];
