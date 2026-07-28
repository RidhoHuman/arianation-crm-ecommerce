# Implementasi SOP E-Commerce Custom Sablon ("The Triple Fix")

Sesuai dengan anatomi pesanan sablon di dunia nyata yang telah dijabarkan, kita akan menyelaraskan sistem dengan menambahkan Dimensi Cetak (Print Size) dan menstandarkan Posisi Cetak (Print Position) untuk meminimalisir kesalahan operasional antara kustomer dan admin/tim produksi.

## User Review Required

> [!IMPORTANT]
> **Perombakan Area Upload Desain**
> Saat ini, sistem menggunakan fitur *Canvas Editor* (drag-and-drop logo ke atas gambar kaos) untuk membuat mockup secara otomatis. Sesuai saran Anda, saya akan **menambahkan opsi input file manual** khusus untuk "Gambar Referensi / Mockup" bagi kustomer yang mungkin sudah memiliki gambar mockup buatan desainer mereka sendiri. Apakah Anda ingin tetap mempertahankan fitur *Canvas Editor* sebagai opsi alternatif, atau menghapusnya sama sekali dan beralih ke formulir *upload* statis murni? (Di rencana ini, saya asumsikan kita akan memberikan opsi upload file statis murni agar lebih sederhana dan cepat sesuai arahan Anda).

## Proposed Changes

### Database Migration

Kita akan membuat sebuah skrip migrasi baru (`migrate-print-size.js`) untuk menambahkan kolom `printSize` ke tabel `designRequest`.

#### [NEW] [migrate-print-size.js](file:///d:/projects/arianation-crm-ecommerce/migrate-print-size.js)
- Menambahkan kolom `printSize` (VARCHAR 255) ke tabel `designRequest`.

### Backend API (Controllers)

Kita akan memperbarui pengontrol pemesanan sablon untuk menerima dan menyimpan data `printSize` serta `mockupPreview` (jika diunggah secara manual).

#### [MODIFY] [customOrderController.js](file:///d:/projects/arianation-crm-ecommerce/src/controllers/customOrderController.js)
- Menerima kolom `printSize` dari `req.body`.
- Menyimpan `printSize` saat melakukan operasi `INSERT` ke tabel `designRequest`.

#### [MODIFY] [designRequestController.js](file:///d:/projects/arianation-crm-ecommerce/src/controllers/designRequestController.js)
- Menerima `printSize` dalam validasi dan menambahkannya pada `INSERT` / `UPDATE`.

### Frontend - Halaman Request Kustomer

Merombak antarmuka pengguna agar lebih terstruktur dan sesuai SOP pesanan sablon.

#### [MODIFY] [DesignRequest.jsx](file:///d:/projects/arianation-crm-ecommerce/frontend/src/pages/DesignRequest.jsx)
- **Posisi Sablon (Dinamis):** Mengubah input teks bebas menjadi *Dropdown* dinamis.
  - Jika kategori *Pakaian*: Dada Kiri, Tengah Depan, Punggung Belakang, dll.
  - Jika kategori *Tas & Merchandise*: Tengah Depan, Tengah Belakang.
- **Ukuran Sablon (Baru):** Menambahkan *Dropdown* (Logo/Kecil, A4/Sedang, A3/Besar, Full).
- **Upload File:** Memisahkan input menjadi dua area yang jelas (seperti yang disarankan):
  1. `[Tombol Upload 1] File Mentahan Resolusi Tinggi (Wajib)`
  2. `[Tombol Upload 2] Gambar Referensi / Mockup (Opsional)`

### Frontend - Admin Panel

Memoles tampilan ulasan agar admin langsung melihat instruksi sablon dalam hitungan detik.

#### [MODIFY] [DesignReviewList.jsx](file:///d:/projects/arianation-crm-ecommerce/frontend/src/components/admin/DesignReviewList.jsx)
- Menambahkan baris info `📏 Ukuran Sablon: {req.printSize}` di bawah bagian Teknik/Posisi.
- (Telah dilakukan) Tombol akses ganda untuk "File Desain" dan "Mockup" kini akan beroperasi penuh jika kedua gambar disediakan oleh kustomer.

## Verification Plan

### Automated Tests
- Menjalankan skrip validasi migrasi MySQL untuk memastikan kolom `printSize` berhasil dibuat.

### Manual Verification
- Masuk sebagai kustomer dan mencoba memilih Tote Bag, memverifikasi pilihan posisi yang tersedia, lalu mengisi ukuran sablon.
- Melakukan upload dua file (Satu PNG logo mentahan, dan satu JPG Mockup tas).
- Menekan tombol submit pesanan sablon, kemudian *login* sebagai Admin.
- Memastikan panel `Review Desain` menampilkan Ukuran, Posisi, dan tombol akses kedua gambar bekerja sempurna.
