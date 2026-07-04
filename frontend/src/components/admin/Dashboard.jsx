import React from 'react';

export default function Dashboard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-3">Admin Dashboard</h2>
      <p className="text-gray-600 mb-4">
        Halaman admin sementara hanya menampilkan placeholder. Anda dapat kembali ke halaman produk atau pesanan nanti.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold">Produk</h3>
          <p className="text-sm text-gray-600">Kelola produk akan tersedia di sini.</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold">Pesanan</h3>
          <p className="text-sm text-gray-600">Kelola pre-order dan order akan tersedia di sini.</p>
        </div>
      </div>
    </div>
  );
}
