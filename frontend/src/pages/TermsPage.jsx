import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-headings:font-display prose-headings:uppercase prose-headings:tracking-widest">
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">Syarat & Ketentuan</h1>
        <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: 26 Juli 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Pendahuluan</h2>
          <p>
            Selamat datang di AriaNation. Dengan mengakses dan menggunakan situs web serta layanan kami, Anda menyetujui untuk terikat dengan Syarat dan Ketentuan berikut. Jika Anda tidak menyetujui syarat-syarat ini, harap tidak menggunakan layanan kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Layanan Custom Sablon</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Uang Muka (DP):</strong> Untuk pesanan custom sablon, pembayaran Uang Muka (DP) minimal sebesar persentase yang ditentukan wajib dilakukan sebelum proses produksi dimulai.</li>
            <li><strong>Pembatalan Sepihak:</strong> Jika kustomer membatalkan pesanan secara sepihak setelah DP dibayarkan dan bahan telah diproses, maka <strong>Uang Muka (DP) dinyatakan hangus</strong> dan tidak dapat dikembalikan.</li>
            <li><strong>Revisi Desain:</strong> Revisi desain tunduk pada kesepakatan awal melalui WhatsApp. Permintaan revisi mayor setelah desain disetujui (Approved) akan dikenakan biaya tambahan.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Pembelian Retail (Ready Stock)</h2>
          <p>
            Semua produk retail yang ditampilkan di situs web tunduk pada ketersediaan stok. Kami berhak membatalkan pesanan jika produk ternyata habis atau terdapat kesalahan harga pada sistem. Pembayaran yang telah dilakukan akan dikembalikan sepenuhnya.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Pengiriman</h2>
          <p>
            Estimasi waktu pengiriman disediakan oleh pihak kurir (pihak ketiga). AriaNation tidak bertanggung jawab atas keterlambatan pengiriman yang disebabkan oleh kelalaian kurir, cuaca buruk, atau kejadian tak terduga lainnya (Force Majeure).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Program Poin & Tier</h2>
          <p>
            Aria Points tidak dapat diuangkan dan hanya dapat digunakan sebagai potongan harga untuk transaksi di AriaNation. Kami berhak mengubah struktur poin, tier, dan kebijakan reward sewaktu-waktu tanpa pemberitahuan sebelumnya.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Hukum yang Berlaku</h2>
          <p>
            Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia. Segala perselisihan akan diselesaikan melalui musyawarah mufakat, atau melalui pengadilan negeri setempat.
          </p>
        </section>
      </div>
    </div>
  );
}
