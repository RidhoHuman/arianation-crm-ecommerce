import React from 'react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-headings:font-display prose-headings:uppercase prose-headings:tracking-widest">
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">Kebijakan Pengembalian</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 26 Juli 2026</p>

        <section className="mb-8">
          <p>
            Di AriaNation, kepuasan pelanggan adalah prioritas utama kami. Oleh karena itu, kami memberlakukan kebijakan pengembalian dana (Refund) dan penukaran barang (Retur) yang jelas dan adil bagi semua pihak.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Kebijakan Retur Produk Retail (Ready Stock)</h2>
          <p>Anda berhak mengajukan penukaran barang atau pengembalian dana jika:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Produk yang Anda terima <strong>cacat produksi</strong> (robek, jahitan lepas, sablon luntur parah sebelum dicuci).</li>
            <li>Produk yang kami kirim <strong>salah ukuran atau salah desain</strong> yang tidak sesuai dengan rincian pesanan Anda.</li>
          </ul>
          <p className="mt-4 font-semibold text-red-600 dark:text-red-400">Syarat Wajib Klaim Retur:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Kustomer <strong>wajib menyertakan video unboxing (buka paket)</strong> yang tidak terpotong dari paket utuh hingga cacat ditemukan. Tanpa video unboxing, klaim tidak dapat kami proses.</li>
            <li>Klaim maksimal diajukan <strong>3 x 24 jam</strong> sejak status resi pengiriman dinyatakan "Diterima".</li>
            <li>Produk harus dalam keadaan belum dipakai, belum dicuci, dan hangtag masih terpasang.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Kebijakan Refund Layanan Custom Sablon</h2>
          <p>Layanan Custom Sablon adalah produk yang dibuat khusus (Made to Order) sesuai permintaan Anda. Oleh karena itu:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Jika pesanan sudah memasuki <strong>tahap produksi massal</strong>, pesanan tidak dapat dibatalkan, ditukar, atau dikembalikan.</li>
            <li><strong>Pembatalan Sepihak:</strong> Jika kustomer membatalkan pesanan setelah membayar DP (Uang Muka) namun proses produksi (atau pembelian bahan baku/pembuatan screen) sudah dimulai, maka <strong>uang DP Anda hangus 100%</strong>.</li>
            <li>Kesalahan ukuran kaos atau letak sablon yang disebabkan oleh kelalaian kustomer dalam memberikan instruksi desain tidak menjadi tanggung jawab AriaNation.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Proses Pengembalian Dana (Refund Process)</h2>
          <p>
            Jika pengajuan pengembalian dana disetujui, kami akan memproses transfer kembali ke rekening awal Anda (atau saldo Aria Points jika Anda setuju) dalam waktu selambat-lambatnya <strong>7 hari kerja</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
