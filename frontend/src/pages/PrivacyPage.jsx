import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-headings:font-display prose-headings:uppercase prose-headings:tracking-widest">
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">Kebijakan Privasi</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 26 Juli 2026</p>

        <section className="mb-8">
          <p>
            AriaNation ("kami", "milik kami", atau "kita") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan situs web kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami dapat mengumpulkan informasi berikut:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Informasi Identifikasi Pribadi:</strong> Nama lengkap, alamat email, nomor telepon genggam, dan tanggal lahir (jika disediakan).</li>
            <li><strong>Informasi Pengiriman:</strong> Alamat lengkap, provinsi, kota, dan kode pos untuk keperluan logistik.</li>
            <li><strong>Informasi Transaksi:</strong> Rincian pesanan, bukti transfer, dan riwayat belanja Anda. Informasi kartu kredit/debit diproses dengan aman oleh pihak ketiga (Payment Gateway) dan kami tidak menyimpan nomor kartu Anda.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Memproses, mengelola, dan mengirimkan pesanan Anda.</li>
            <li>Menghubungi Anda terkait status pesanan, revisi desain sablon, dan dukungan pelanggan.</li>
            <li>Mengirimkan pembaruan, faktur, promosi, dan penawaran khusus (jika Anda berlangganan buletin kami).</li>
            <li>Meningkatkan pengalaman pengguna di situs web kami.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Perlindungan Data</h2>
          <p>
            Kami menerapkan berbagai langkah keamanan teknis dan organisasional untuk menjaga keamanan informasi pribadi Anda. Kata sandi Anda dienkripsi secara aman. Namun, perlu diingat bahwa tidak ada transmisi data di internet yang 100% sepenuhnya aman.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Pihak Ketiga</h2>
          <p>
            Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada pihak luar. Kami hanya membagikan data Anda kepada mitra tepercaya (seperti kurir pengiriman dan Payment Gateway) semata-mata untuk tujuan memenuhi pesanan Anda.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Cookie</h2>
          <p>
            Situs web kami menggunakan "cookie" untuk melacak sesi login Anda dan menyimpan keranjang belanja Anda. Anda dapat mengatur browser Anda untuk menolak cookie, namun beberapa fitur situs mungkin tidak berfungsi dengan baik.
          </p>
        </section>
      </div>
    </div>
  );
}
